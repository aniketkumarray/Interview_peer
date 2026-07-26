import { NextRequest, NextResponse } from 'next/server';
import { MOCK_SESSIONS } from '@/lib/demo-store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = MOCK_SESSIONS.find((s) => s.id === id) || MOCK_SESSIONS[0];

  const startTime = new Date(session.scheduledAt);
  const endTime = new Date(startTime.getTime() + session.durationMinutes * 60 * 1000);

  const formatDate = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d+/g, '');
  };

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PeerMock//Mock Interview Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:session-${session.id}@peermock.app`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(startTime)}`,
    `DTEND:${formatDate(endTime)}`,
    `SUMMARY:Peer Mock Interview: ${session.format} (${session.durationMinutes}m)`,
    `DESCRIPTION:Reciprocal mock interview session on ${session.format}.\\n\\nVideo Room Link: ${session.jitsiRoomUrl}`,
    `LOCATION:${session.jitsiRoomUrl}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  return new NextResponse(icsContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="mock-interview-${session.id}.ics"`,
    },
  });
}
