import { google } from 'googleapis';

export async function createTask(tokens, taskData) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: tokens?.access_token });

  const tasks = google.tasks({ version: 'v1', auth });

  const taskResource = { ...taskData };

  // The Google Tasks API expects the 'due' field to be an RFC 3339 timestamp.
  if (taskResource.due) {
    taskResource.due = new Date(taskResource.due).toISOString();
  }

  const response = await tasks.tasks.insert({
    tasklist: '@default', // or a specific task list ID
    resource: taskResource,
  });

  return response.data;
}

export async function updateTask(tokens, taskId, taskData) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: tokens?.access_token });

  const tasks = google.tasks({ version: 'v1', auth });

  const taskResource = { ...taskData, id: taskId };

  if (taskResource.due) {
    taskResource.due = new Date(taskResource.due).toISOString();
  }

  const response = await tasks.tasks.update({
    tasklist: '@default',
    task: taskId,
    requestBody: taskResource,
  });

  return response.data;
}

export async function deleteTask(tokens, taskId) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: tokens?.access_token });

  const tasks = google.tasks({ version: 'v1', auth });

  await tasks.tasks.delete({
    tasklist: '@default',
    task: taskId,
  });

  return { message: 'Task deleted successfully.' };
}