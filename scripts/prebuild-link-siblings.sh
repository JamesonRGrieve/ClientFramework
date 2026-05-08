#!/usr/bin/env bash
# prebuild-link-siblings.sh
#
# For each sibling repo (../auth, ../zod2gql, ../dynamic-form) that exists on
# disk, build it in-place and symlink it into node_modules/<package-name> so
# the developer's local checkout is used at build time instead of any version
# resolved from the registry or the in-tree git submodule.
#
# If a sibling does NOT exist on disk, fall back silently to whatever lives
# at the in-tree submodule path (src/components/<name>/, src/lib/<name>/) and
# the path aliases in tsconfig.json. This keeps the build pipeline functional
# whether or not the developer is doing the multi-repo workflow.
#
# Idempotent: safe to re-run. Silent on absence: missing siblings are not an
# error condition.

set -u

THIS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SIBLING_ROOT="$(cd "${THIS_DIR}/.." && pwd)"
NODE_MODULES="${THIS_DIR}/node_modules"

# Sibling directory names under SIBLING_ROOT to consider.
SIBLINGS=(
    "auth"
    "zod2gql"
    "dynamic-form"
)

read_pkg_name() {
    node -e "process.stdout.write(require('$1/package.json').name)" 2>/dev/null
}

pm_for() {
    if [ -f "$1/pnpm-lock.yaml" ]; then
        echo "pnpm"
    else
        echo "npm"
    fi
}

link_sibling() {
    local name="$1"
    local sib_dir="${SIBLING_ROOT}/${name}"

    if [ ! -d "${sib_dir}" ]; then
        return 0  # silent: fall back to submodule
    fi
    if [ ! -f "${sib_dir}/package.json" ]; then
        echo "[prebuild-link] ${name}: sibling exists but has no package.json — skipping" >&2
        return 0
    fi

    local pkg
    pkg="$(read_pkg_name "${sib_dir}")"
    if [ -z "${pkg}" ]; then
        echo "[prebuild-link] ${name}: cannot read package.json name — skipping" >&2
        return 0
    fi

    local pm
    pm="$(pm_for "${sib_dir}")"

    echo "[prebuild-link] ${name}: building (${pm}) at ${sib_dir}"
    (
        cd "${sib_dir}" || exit 0
        "${pm}" run --silent compile >/dev/null 2>&1 \
            || "${pm}" run --silent build >/dev/null 2>&1 \
            || true
    )

    # Symlink into node_modules under the package's actual name (handles scopes).
    local target="${NODE_MODULES}/${pkg}"
    local parent
    parent="$(dirname "${target}")"
    mkdir -p "${parent}"

    # If target is already the right symlink, do nothing. Otherwise replace.
    if [ -L "${target}" ]; then
        local current
        current="$(readlink "${target}")"
        if [ "${current}" = "${sib_dir}" ]; then
            echo "[prebuild-link] ${name}: already linked (${pkg} -> ${sib_dir})"
            return 0
        fi
        rm -f "${target}"
    elif [ -e "${target}" ]; then
        # A real directory or file lives there (e.g. installed from registry).
        # Move it aside so we can symlink without destroying it permanently.
        rm -rf "${target}.prebuild-bak"
        mv "${target}" "${target}.prebuild-bak"
    fi

    ln -s "${sib_dir}" "${target}"
    echo "[prebuild-link] ${name}: linked ${pkg} -> ${sib_dir}"
}

for s in "${SIBLINGS[@]}"; do
    link_sibling "${s}"
done

exit 0
