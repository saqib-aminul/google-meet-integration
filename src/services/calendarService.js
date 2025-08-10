import { google } from 'googleapis';
import { v4 as uuidv4 } from 'uuid';

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
    conferenceData: generateGoogleMeetingLink()
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

export async function generateGoogleMeetingLink() {
    return {
      createRequest: {
        requestId: uuidv4(),
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      }
    };
}

export async function createCalendarEvent(tokens, eventData) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: tokens?.access_token });

  const calendar = google.calendar({ version: 'v3', auth });

  const event = {
    summary: eventData?.summary,
    description: eventData?.description,
    start: {
      dateTime: new Date(eventData?.startTime).toISOString(),
      timeZone: 'UTC',
    },
    end: {
      dateTime: new Date(eventData?.endTime).toISOString(),
      timeZone: 'UTC',
    },
    attendees: eventData?.attendees.map(email => ({ email })),
  };

  // Add Google Meet conference data if isMeeting is true
  if (eventData.isMeeting) {
    event.conferenceData = generateGoogleMeetingLink()
  }

  const response = await calendar.events.insert({
    calendarId: 'primary',
    resource: event,
    conferenceDataVersion: eventData?.isMeeting ? 1 : 0
  });
  console.log(JSON.parse(JSON.stringify(response, null, 2)))

  // Extract meet link if conference data exists
  let meetLink = null;
  if (eventData.isMeeting && response.data.conferenceData?.entryPoints) {
    const entryPoints = response.data.conferenceData.entryPoints;
    meetLink = entryPoints.find(e => e.entryPointType === 'video')?.uri;
  }

  return {
    ...response.data,
    meetLink
  };
}

export async function updateCalendarEvent(tokens, eventId, eventData) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: tokens?.access_token });

  const calendar = google.calendar({ version: 'v3', auth });

  try {
    // First, fetch the existing event to preserve all fields
    const existingEventResponse = await calendar.events.get({
      calendarId: 'primary',
      eventId: eventId,
    });
    
    const existingEvent = existingEventResponse.data;
    console.log('Existing event:', existingEvent);
    console.log('Update data:', eventData);
    
    // Helper function to check if a value should be updated
    const shouldUpdate = (newValue) => {
      return newValue !== undefined && newValue !== null && newValue !== '';
    };
    
    // Start with the existing event and only update specified fields
    const event = {
      summary: shouldUpdate(eventData?.summary) ? eventData.summary : existingEvent.summary,
      description: shouldUpdate(eventData?.description) ? eventData.description : existingEvent.description,
      location: shouldUpdate(eventData?.location) ? eventData.location : existingEvent.location,
      start: shouldUpdate(eventData?.startTime) ? {
        dateTime: new Date(eventData.startTime).toISOString(),
        timeZone: existingEvent.start?.timeZone || 'UTC',
      } : existingEvent.start,
      end: shouldUpdate(eventData?.endTime) ? {
        dateTime: new Date(eventData.endTime).toISOString(),
        timeZone: existingEvent.end?.timeZone || 'UTC',
      } : existingEvent.end,
      attendees: eventData?.attendees !== undefined ? 
        (Array.isArray(eventData.attendees) ? eventData.attendees.map(email => ({ email })) : []) : 
        existingEvent.attendees || [],
    };
    
    // Handle conference data (Google Meet)
    if (eventData?.isMeeting === true) {
      // Add new Google Meet link
      event.conferenceData = await generateGoogleMeetingLink();
    } else if (eventData?.isMeeting === false) {
      // Explicitly remove Google Meet link
      event.conferenceData = null;
    } else {
      // Preserve existing conference data if not specified
      if (existingEvent.conferenceData) {
        event.conferenceData = existingEvent.conferenceData;
      }
    }
    
    console.log('Final event to update:', event);
    
    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId: eventId,
      resource: event,
      conferenceDataVersion: eventData?.isMeeting === true ? 1 : 0
    });
  
    // Extract meet link if conference data exists
    let meetLink = null;
    if (response.data.conferenceData?.entryPoints) {
      const entryPoints = response.data.conferenceData.entryPoints;
      meetLink = entryPoints.find(e => e.entryPointType === 'video')?.uri;
    }
  
    return {
      ...response.data,
      meetLink
    };
  } catch (error) {
    console.error('Error updating calendar event:', error);
    throw error;
  }
}

export async function deleteCalendarEvent(tokens, eventId) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: tokens?.access_token });

  const calendar = google.calendar({ version: 'v3', auth });

  const response = await calendar.events.delete({
    calendarId: 'primary',
    eventId: eventId,
  });

  return response.data;
}

export async function getCalendarEvents(tokens) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials(tokens);

  const calendar = google.calendar({ version: 'v3', auth });

  // const list = await calendar.calendarList.list()
  // console.log({ list })

  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: (new Date()).toISOString(),
    maxResults: 10,
    singleEvents: true,
    showDeleted: tokens?.id_deleted ? true : false,
    orderBy: 'startTime',
  });

  return { response };
}

export async function watchCalendar(tokens, channel) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: tokens?.access_token });

  const calendar = google.calendar({ version: 'v3', auth });

  try {
    const response = await calendar.events.watch({
      calendarId: 'primary',
      requestBody: {
        id: channel.id,           // Unique channel ID
        type: 'web_hook',
        address: channel.address, // Your public HTTPS endpoint
        token: channel.token,     // Optional: verification token
        params: {
          ttl: '3600'            // Time to live in seconds (max 24 hours)
        }
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error setting up watch:', error);
    throw error;
  }
}

export async function stopWatch(tokens, channelId, resourceId) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: tokens?.access_token });

  const calendar = google.calendar({ version: 'v3', auth });

  try {
    await calendar.channels.stop({
      requestBody: {
        id: channelId,
        resourceId: resourceId
      }
    });
  } catch (error) {
    console.error('Error stopping watch:', error);
    throw error;
  }
}
