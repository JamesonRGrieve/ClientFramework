'use client';

import SwitchColorblind from '@/components/theme/SwitchColorblind';
import SwitchDark from '@/components/theme/SwitchDark';
import React, { ReactNode, useEffect, useState } from 'react';
import { LuPalette as Palette } from 'react-icons/lu';
import HeaderFooter, { HeaderFooterProps } from './AppWrapperHeaderFooter';

type Menu =
  | {
      heading?: string;
      icon?: ReactNode;
      swr?: any;
      menu?: any;
      width: string;
    }
  | {
      heading?: string;
      icon?: ReactNode;
      staticMenu: ReactNode;
      width: string;
    };

type PopoutHeaderProps = {
  height?: string | undefined;
  components?: {
    left?: ReactNode | Menu | undefined;
    center?: ReactNode | undefined;
    right?: ReactNode | Menu | undefined;
  } | undefined;
};

export type AppWrapperProps = {
  header?: (HeaderFooterProps | PopoutHeaderProps) | undefined;
  footer?: HeaderFooterProps | undefined;
  inner?: boolean | undefined;
  mainSX?: React.CSSProperties | undefined;
  keepThemeToggles?: boolean | undefined;
};

const switches = (
  <>
    <SwitchDark />
    <SwitchColorblind />
  </>
);

export default function AppWrapper({
  header,
  footer,
  inner = true,
  mainSX = {},
  keepThemeToggles = false,
  children,
}: AppWrapperProps & { children: ReactNode }) {
  const [open, setOpen] = useState({ left: false, right: false });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 600);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  header = header
    ? {
        height: '3rem',
        ...header,
        components: {
          ...header?.components,
          right: header?.components?.right ? (
            keepThemeToggles ? (
              <>
                {header.components.right}
                {switches}
              </>
            ) : (
              header.components.right
            )
          ) : isMobile ? (
            {
              icon: <Palette />,
              swr: () => {},
              menu: () => switches,
              width: '5rem',
            }
          ) : (
            switches
          ),
        },
      }
    : undefined;

  footer = footer ? { height: '2rem', ...footer } : undefined;

  return (
    <>
      {header && (
        <HeaderFooter
          {...(header.height !== undefined ? { height: header.height } : {})}
          {...(header.components !== undefined
            ? {
                components: {
                  left: header.components.left as ReactNode,
                  center: header.components.center ? (
                    typeof header.components.center === 'string' ? (
                      <h1 className={`text-center ${inner ? 'text-2xl' : 'text-3xl'} whitespace-nowrap`}>
                        {header.components.center}
                      </h1>
                    ) : (
                      <div className='flex items-center justify-between h-full'>{header.components.center}</div>
                    )
                  ) : undefined,
                  right: header.components.right as ReactNode,
                },
              }
            : {})}
        />
      )}
      <MainSection {...{ inner, open, header, mainSX, footer, children }} />
      {footer && (
        <HeaderFooter
          {...(footer.components !== undefined ? { components: footer.components } : {})}
          {...(footer.height !== undefined ? { height: footer.height } : {})}
          footer
        />
      )}
    </>
  );
}

const MainSection = ({
  inner,
  open,
  header,
  mainSX,
  footer,
  children,
}: AppWrapperProps & { children: ReactNode; open: { left: boolean; right: boolean } }) => {
  return (
    <div
      className={`
        flex flex-col grow shrink-0 relative overflow-y-auto
        transition-[margin] duration-300 ease-in-out
      `}
      style={{
        margin: `0 ${open.right ? (header?.components?.right as unknown as Menu)?.width : 0} 0 ${
          open.left ? (header?.components?.left as unknown as Menu)?.width : 0
        }`,
        ...mainSX,
      }}
    >
      {children}
    </div>
  );
};
