/**
 * Email Tool Interface and Adapters
 * Provides safe operations for communication
 */

export interface EmailMessage {
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  snippet: string;
  body?: string;
  date: string;
}

export interface EmailAdapter {
  searchEmail(query: string): Promise<EmailMessage[]>;
  getEmail(id: string): Promise<EmailMessage | null>;
  draftEmail(to: string, subject: string, body: string): Promise<{ draft_id: string; status: string }>;
  sendEmail(draftId: string, confirmedByUser: boolean): Promise<{ success: boolean; message: string }>;
}

export class MockEmailAdapter implements EmailAdapter {
  private emails: EmailMessage[] = [
    {
      id: 'email-1',
      sender: 'housing-office@citygov.org',
      recipient: 'user@example.com',
      subject: 'ACTION REQUIRED: Benefits Recertification Deadline',
      snippet: 'Please verify your application by end of business today...',
      body: 'Please verify your application documentation by end of business today (5:00 PM). Call our helpline if you need extensions.',
      date: '2026-09-16T08:15:00Z'
    },
    {
      id: 'email-2',
      sender: 'recruiter@techjobs.io',
      recipient: 'user@example.com',
      subject: 'Interview availability for Frontend role',
      snippet: 'We loved your profile and would like to schedule a 30 min chat...',
      body: 'Hi, we saw your application and would love to schedule a screening next week.',
      date: '2026-09-15T14:30:00Z'
    }
  ];

  private drafts: Map<string, { to: string; subject: string; body: string }> = new Map();

  async searchEmail(query: string): Promise<EmailMessage[]> {
    const q = query.toLowerCase();
    return this.emails.filter(e => 
      e.subject.toLowerCase().includes(q) || 
      e.snippet.toLowerCase().includes(q) ||
      e.sender.toLowerCase().includes(q)
    );
  }

  async getEmail(id: string): Promise<EmailMessage | null> {
    return this.emails.find(e => e.id === id) || null;
  }

  async draftEmail(to: string, subject: string, body: string): Promise<{ draft_id: string; status: string }> {
    const draftId = `draft-${Date.now()}`;
    this.drafts.set(draftId, { to, subject, body });
    return { draft_id: draftId, status: 'Draft created. Awaiting explicit user confirmation before sending.' };
  }

  async sendEmail(draftId: string, confirmedByUser: boolean): Promise<{ success: boolean; message: string }> {
    if (!confirmedByUser) {
      return {
        success: false,
        message: 'Safety policy enforcement: Automatic email sending rejected. User must explicitly confirm before sending.'
      };
    }
    if (!this.drafts.has(draftId)) {
      return { success: false, message: 'Draft not found.' };
    }
    this.drafts.delete(draftId);
    return { success: true, message: 'Email sent successfully after user confirmation.' };
  }
}
