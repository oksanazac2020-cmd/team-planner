import { tasksTable } from '@/lib/supabase.server';

const taskColumns = 'project,name,assignee,deadline,status,comment';

function serializeTask(row: Record<string, unknown>) {
  return {
    project: row.project,
    task: row.name,
    assignee: row.assignee,
    deadline: row.deadline,
    status: row.status,
    comment: row.comment,
  };
}

export async function GET() {
  const { data, error } = await tasksTable().select(taskColumns);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json((data ?? []).map(serializeTask));
}

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const task = {
    project: String(body.project ?? '').trim(),
    name: String(body.task ?? '').trim(),
    assignee: String(body.assignee ?? '').trim(),
    deadline: String(body.deadline ?? ''),
    status: String(body.status ?? ''),
    comment: String(body.comment ?? '').trim(),
  };

  if (Object.values(task).some((value) => !value)) {
    return Response.json({ error: 'Все поля задачи обязательны.' }, { status: 400 });
  }

  const { error } = await tasksTable().insert(task);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(serializeTask(task), { status: 201 });
}
