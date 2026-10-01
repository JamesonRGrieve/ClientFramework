'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later

import Link from 'next/link.js';
import { useState } from 'react';
import { useUser } from 'zephyrex/hooks';
import { SidebarPage } from 'zephyrex/components/appwrapper/src/SidebarPage';
import { Alert, AlertDescription, AlertTitle } from 'zephyrex/ui/alert';
import { Button } from 'zephyrex/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from 'zephyrex/ui/card';
import { Input } from 'zephyrex/ui/input';
import { Label } from 'zephyrex/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'zephyrex/ui/select';
import { Textarea } from 'zephyrex/ui/textarea';

/** The labels of a registrable domain, e.g. `example.com` of `app.example.com`. */
const REGISTRABLE_DOMAIN_LABELS = 2;

const requestTypes = [
  { value: 'bug', label: 'Report a Bug' },
  { value: 'technical', label: 'Technical Support' },
  { value: 'billing', label: 'Billing Issue' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'other', label: 'Other' },
];

export default function SupportPage() {
  const { data: userData } = useUser();
  const [formData, setFormData] = useState({
    type: '',
    subject: '',
    user: '',
    platform: '',
    description: '',
  });

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const submissionData = {
      ...formData,
      // Signed out, there is no user; the email then says so.
      user: userData === undefined ? '' : JSON.stringify(userData),
      platform: JSON.stringify(window.navigator.userAgent),
    };
    sendAsEmail(submissionData);
  };

  return (
    <SidebarPage title='Support' className='flex flex-col items-center justify-center'>
      <Alert>
        <AlertTitle>Early Access Software</AlertTitle>
        <AlertDescription>
          This is an early-access deployment of open-source software. You may encounter problems or &quot;bugs&quot;. If you
          do, please make note of your most recent actions and{' '}
          <Link
            className='text-info hover:underline'
            href='https://github.com/JamesonRGrieve/ClientFramework/issues/new?template=bug_report_prod.yml'
          >
            let us know by making a report here
          </Link>
          . Your understanding as we build towards the future is much appreciated.
        </AlertDescription>
      </Alert>

      <Card className='w-full max-w-lg border rounded-md'>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Support Request</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-1'>
              <Label htmlFor='type'>What type of support do you need?</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder='Select request type' />
                </SelectTrigger>
                <SelectContent>
                  {requestTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.type && (
              <>
                <div className='space-y-1'>
                  <Label htmlFor='subject'>Subject</Label>
                  <Input
                    id='subject'
                    placeholder='Brief description of the issue'
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                  />
                </div>

                <div className='space-y-1'>
                  <Label htmlFor='description'>Description</Label>
                  <Textarea
                    id='description'
                    placeholder='Please provide detailed information about your request'
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>
              </>
            )}
          </CardContent>
          <CardFooter>
            {formData.type && (
              <Button type='submit' className='w-full m-auto'>
                Submit Request
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </SidebarPage>
  );
}

interface SubmissionData {
  type: string;
  subject: string;
  description: string;
  user: string;
  platform: string;
}

function sendAsEmail(submissionData: SubmissionData) {
  // The app's own registrable domain: the API is served on its origin.
  const tld = window.location.hostname.split('.').slice(-REGISTRABLE_DOMAIN_LABELS).join('.');
  const emailAddress = `support@${tld}`;

  // Format the email body
  const emailBody = `
Type: ${submissionData.type}
Subject: ${submissionData.subject}

Description:
${submissionData.description}

User Info:
${submissionData.user || 'Not logged in'}

Platform info:
${submissionData.platform}
  `.trim();

  // Create mailto URL
  const mailtoUrl = `mailto:${emailAddress}?subject=${encodeURIComponent(submissionData.subject)}&body=${encodeURIComponent(emailBody)}`;

  // Open the email client
  window.location.href = mailtoUrl;
}
