import { google } from 'googleapis';
import { v4 as uuidv4 } from 'uuid';

// export async function createMeetEvent(tokens, { startTime, endTime, attendees }) {
//   const auth = new google.auth.OAuth2();
//   auth.setCredentials(tokens);

//   const calendar = google.calendar({ version: 'v3', auth });

//   const event = {
//     summary: 'Task-level Meet',
//     description: 'Auto-generated Google Meet link',
//     start: { dateTime: startTime },
//     end: { dateTime: endTime },
//     attendees: attendees.map(email => ({ email })),
//     conferenceData: {
//       createRequest: {
//         requestId: uuidv4(),  // Unique per request
//         conferenceSolutionKey: { type: 'hangoutsMeet' },
//       }
//     }
//   };

//   const response = await calendar.events.insert({
//     calendarId: 'primary',
//     resource: event,
//     conferenceDataVersion: 1
//   });

//   const entryPoints = response.data.conferenceData?.entryPoints || [];
//   const meetLink = entryPoints.find(e => e.entryPointType === 'video')?.uri;

//   // return meetLink;
//   return { response, entryPoints, meetLink };
// }

export async function createMeetEvent(tokens, { startTime, endTime, attendees }) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: tokens?.access_token });

  const calendar = google.calendar({ version: 'v3', auth });

  const event = {
    summary: 'Task-level Meet',
    description: 'Auto-generated Google Meet link',
    start: { dateTime: new Date(startTime).toISOString() },
    end: { dateTime: new Date(endTime).toISOString() },
    attendees: attendees.map(email => ({ email })),
    conferenceData: {
      createRequest: {
        requestId: uuidv4(),
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      }
    }
  };

  const response = await calendar.events.insert({
    calendarId: 'primary',
    resource: event,
    conferenceDataVersion: 1
  });

  const entryPoints = response.data.conferenceData?.entryPoints || [];
  const meetLink = entryPoints.find(e => e.entryPointType === 'video')?.uri;

  return { response, entryPoints, meetLink };
}


export async function getCalendarEvents(tokens) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials(tokens);

  const calendar = google.calendar({ version: 'v3', auth });

  const list = await calendar.calendarList.list()
  console.log({ list })

  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: (new Date()).toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
  });

  return { response, list };
}
