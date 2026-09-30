// SPDX-License-Identifier: AGPL-3.0-or-later
import TimeAgo, { type FormatStyleName } from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
import log, { ERRORS_ONLY } from './log';

TimeAgo.addDefaultLocale(en);

const timeAgo = new TimeAgo('en-US');

export const formatTimeAgo = (date: Date | string, style: FormatStyleName = 'twitter'): string => {
  if (!date) {
    return '';
  }
  try {
    const parsedDate = typeof date === 'string' ? new Date(date) : date;
    return timeAgo.format(parsedDate, style);
  } catch (error) {
    log(['Error formatting date:', error], ERRORS_ONLY);
    return '';
  }
};
