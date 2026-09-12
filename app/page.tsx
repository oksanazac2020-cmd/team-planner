'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';

type Task = { project: string; task: string; assignee: string; initials: string; avatar: string; deadline: string; deadlineDate: string; status: string; statusStyle: string; comment: string };

type StoredTask = Pick<Task, 'project' | 'task' | 'assignee' | 'status' | 'comment'> & {
  deadline: string;
};

const initialTasks: Task[] = [
  { project: 'Редизайн сайта', task: 'Подготовить прототип главной страницы', assignee: 'Анна К.', initials: 'АК', avatar: 'bg-[#f0deff] text-[#7530a7]', deadline: '24 сентября', deadlineDate: '2026-09-24', status: 'В работе', statusStyle: 'bg-[#fff3d6] text-[#966513]', comment: 'Ждём финальные тексты от редакции' },
  { project: 'Мобильное приложение', task: 'Проверить сценарий онбординга', assignee: 'Михаил Л.', initials: 'МЛ', avatar: 'bg-[#dcecff] text-[#2d64a7]', deadline: '26 сентября', deadlineDate: '2026-09-26', status: 'На проверке', statusStyle: 'bg-[#e3efff] text-[#2863a3]', comment: 'Нужна проверка на iOS и Android' },
  { project: 'Исследование', task: 'Собрать результаты интервью', assignee: 'Елена С.', initials: 'ЕС', avatar: 'bg-[#dff4e6] text-[#347250]', deadline: '28 сентября', deadlineDate: '2026-09-28', status: 'Запланировано', statusStyle: 'bg-[#eeedf3] text-[#696575]', comment: '8 из 12 интервью уже готовы' },
  { project: 'Маркетинг', task: 'Сверстать ежемесячный дайджест', assignee: 'Игорь П.', initials: 'ИП', avatar: 'bg-[#ffe2dc] text-[#a84f3d]', deadline: '30 сентября', deadlineDate: '2026-09-30', status: 'В работе', statusStyle: 'bg-[#fff3d6] text-[#966513]', comment: 'Добавить блок с кейсами клиентов' },
  { project: 'Поддержка', task: 'Обновить базу знаний', assignee: 'Ольга Р.', initials: 'ОР', avatar: 'bg-[#e7e3ff] text-[#6152aa]', deadline: '2 октября', deadlineDate: '2026-10-02', status: 'Готово', statusStyle: 'bg-[#def3e6] text-[#31704b]', comment: 'Опубликовано 14 новых статей' },
];

const statusStyles: Record<string, string> = {
  'Запланировано': 'bg-[#eeedf3] text-[#696575]',
  'В работе': 'bg-[#fff3d6] text-[#966513]',
  'На проверке': 'bg-[#e3efff] text-[#2863a3]',
  'Готово': 'bg-[#def3e6] text-[#31704b]',
};

const fieldClass = 'h-10 rounded-[10px] border-[#dfe1e5] bg-white px-3 shadow-none focus-visible:border-[#8b8f98] focus-visible:ring-[#8b8f98]/15';

function makeInitials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
}

function formatDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(new Date(year, month - 1, day));
}

function toTask(row: StoredTask): Task {
  return {
    ...row,
    initials: makeInitials(row.assignee),
    avatar: 'bg-[#e6e9f5] text-[#536184]',
    deadlineDate: row.deadline,
    deadline: formatDate(row.deadline),
    statusStyle: statusStyles[row.status] ?? statusStyles['Запланировано'],
  };
}

function isTaskOverdue(task: Task) {
  if (task.status === 'Готово') return false;
  const [year, month, day] = task.deadlineDate.split('-').map(Number);
  const deadline = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return deadline < today;
}

export default function Home() {
  const [tasks, setTasks] = useState(initialTasks);
  const [isOpen, setIsOpen] = useState(false);
  const [projectFilter, setProjectFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [deadlineFilter, setDeadlineFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    let active = true;

    async function loadTasks() {
      try {
        const response = await fetch('/api/tasks');
        if (!response.ok) throw new Error('Не удалось загрузить задачи.');
        const rows = (await response.json()) as StoredTask[];
        if (active) setTasks(rows.map(toTask));
      } catch (error) {
        console.error(error);
      }
    }

    void loadTasks();
    return () => {
      active = false;
    };
  }, []);

  const filterOptions = useMemo(() => ({
    projects: [...new Set(tasks.map((task) => task.project))],
    assignees: [...new Set(tasks.map((task) => task.assignee))],
    deadlines: [...new Set(tasks.map((task) => task.deadline))],
    statuses: [...new Set(tasks.map((task) => task.status))],
  }), [tasks]);

  const filteredTasks = tasks.filter((task) =>
    (!projectFilter || task.project === projectFilter) &&
    (!assigneeFilter || task.assignee === assigneeFilter) &&
    (!deadlineFilter || task.deadline === deadlineFilter) &&
    (!statusFilter || task.status === statusFilter)
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const status = String(data.get('status'));
    const assignee = String(data.get('assignee')).trim();

    const newTask = {
      project: String(data.get('project')).trim(),
      task: String(data.get('task')).trim(),
      assignee,
      deadline: String(data.get('deadline')),
      status,
      comment: String(data.get('comment')).trim(),
    };

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      });

      if (!response.ok) throw new Error('Не удалось сохранить задачу.');
      const savedTask = (await response.json()) as StoredTask;
      setTasks((current) => [toTask(savedTask), ...current]);

      form.reset();
      setIsOpen(false);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f7f9] px-4 py-8 text-[#202124] sm:px-8 lg:px-12 lg:py-12">
      <section className="mx-auto max-w-[1440px]">
        <header className="mb-8 flex items-end justify-between gap-6">
          <div>
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#7b7f89]">Рабочее пространство</p>
            <h1 className="text-[32px] font-semibold tracking-[-0.035em] text-[#1c1d20] sm:text-[38px]">Задачи</h1>
          </div>
          <div className="flex items-center gap-4 pb-1">
            <p className="hidden text-sm text-[#777b84] sm:block">{tasks.length} задач</p>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger render={<Button className="h-10 rounded-[10px] bg-[#25272c] px-4 text-white hover:bg-[#3a3d43]" />}>
                <Plus className="size-4" />
                Новая задача
              </DialogTrigger>
              <DialogContent className="max-h-[calc(100vh-2rem)] max-w-[620px] gap-0 overflow-y-auto rounded-[16px] bg-white p-0 text-[#24262b] ring-[#dfe1e5]">
                <DialogHeader className="gap-2 px-6 pb-5 pt-6">
                  <DialogTitle className="text-xl font-semibold tracking-[-0.02em]">Новая задача</DialogTitle>
                  <DialogDescription className="text-[#747881]">Заполните все поля, чтобы добавить задачу в таблицу.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-5 px-6 pb-6 sm:grid-cols-2">
                    <div className="grid gap-2"><Label htmlFor="project">Проект</Label><Input id="project" name="project" placeholder="Название проекта" required className={fieldClass} /></div>
                    <div className="grid gap-2"><Label htmlFor="task">Задача</Label><Input id="task" name="task" placeholder="Что нужно сделать" required className={fieldClass} /></div>
                    <div className="grid gap-2"><Label htmlFor="assignee">Исполнитель</Label><Input id="assignee" name="assignee" placeholder="Имя и фамилия" required className={fieldClass} /></div>
                    <div className="grid gap-2"><Label htmlFor="deadline">Дедлайн</Label><Input id="deadline" name="deadline" type="date" required className={fieldClass} /></div>
                    <div className="grid gap-2 sm:col-span-2">
                      <Label htmlFor="status">Статус</Label>
                      <NativeSelect id="status" name="status" required className="w-full [&_select]:h-10 [&_select]:rounded-[10px] [&_select]:border-[#dfe1e5] [&_select]:bg-white [&_select]:px-3">
                        <NativeSelectOption value="Запланировано">Запланировано</NativeSelectOption>
                        <NativeSelectOption value="В работе">В работе</NativeSelectOption>
                        <NativeSelectOption value="На проверке">На проверке</NativeSelectOption>
                        <NativeSelectOption value="Готово">Готово</NativeSelectOption>
                      </NativeSelect>
                    </div>
                    <div className="grid gap-2 sm:col-span-2"><Label htmlFor="comment">Комментарий</Label><Textarea id="comment" name="comment" placeholder="Добавьте пояснение к задаче" required className="min-h-24 rounded-[10px] border-[#dfe1e5] bg-white px-3 py-2.5 shadow-none focus-visible:border-[#8b8f98] focus-visible:ring-[#8b8f98]/15" /></div>
                  </div>
                  <DialogFooter className="m-0 rounded-b-[16px] border-[#e8e9ec] bg-[#fafafa] px-6 py-4">
                    <DialogClose render={<Button type="button" variant="outline" className="h-10 rounded-[10px] border-[#dfe1e5] bg-white px-4 text-[#44474e] hover:bg-[#f1f2f4]" />}>Отмена</DialogClose>
                    <Button type="submit" className="h-10 rounded-[10px] bg-[#25272c] px-5 text-white hover:bg-[#3a3d43]">Сохранить</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <div className="overflow-hidden rounded-[16px] border border-[#e4e6ea] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.03),0_8px_24px_rgba(16,24,40,0.04)]">
          <div className="grid gap-3 border-b border-[#e8e9ec] bg-white px-5 py-4 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
            <div className="grid gap-1.5">
              <Label htmlFor="filter-project" className="text-[11px] uppercase tracking-[0.08em] text-[#7a7e87]">Проект</Label>
              <NativeSelect id="filter-project" value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)} className="w-full [&_select]:h-9 [&_select]:rounded-[9px] [&_select]:border-[#dfe1e5] [&_select]:bg-white [&_select]:px-3">
                <NativeSelectOption value="">Все проекты</NativeSelectOption>
                {filterOptions.projects.map((value) => <NativeSelectOption key={value} value={value}>{value}</NativeSelectOption>)}
              </NativeSelect>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="filter-assignee" className="text-[11px] uppercase tracking-[0.08em] text-[#7a7e87]">Исполнитель</Label>
              <NativeSelect id="filter-assignee" value={assigneeFilter} onChange={(event) => setAssigneeFilter(event.target.value)} className="w-full [&_select]:h-9 [&_select]:rounded-[9px] [&_select]:border-[#dfe1e5] [&_select]:bg-white [&_select]:px-3">
                <NativeSelectOption value="">Все исполнители</NativeSelectOption>
                {filterOptions.assignees.map((value) => <NativeSelectOption key={value} value={value}>{value}</NativeSelectOption>)}
              </NativeSelect>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="filter-deadline" className="text-[11px] uppercase tracking-[0.08em] text-[#7a7e87]">Дедлайн</Label>
              <NativeSelect id="filter-deadline" value={deadlineFilter} onChange={(event) => setDeadlineFilter(event.target.value)} className="w-full [&_select]:h-9 [&_select]:rounded-[9px] [&_select]:border-[#dfe1e5] [&_select]:bg-white [&_select]:px-3">
                <NativeSelectOption value="">Все дедлайны</NativeSelectOption>
                {filterOptions.deadlines.map((value) => <NativeSelectOption key={value} value={value}>{value}</NativeSelectOption>)}
              </NativeSelect>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="filter-status" className="text-[11px] uppercase tracking-[0.08em] text-[#7a7e87]">Статус</Label>
              <NativeSelect id="filter-status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-full [&_select]:h-9 [&_select]:rounded-[9px] [&_select]:border-[#dfe1e5] [&_select]:bg-white [&_select]:px-3">
                <NativeSelectOption value="">Все статусы</NativeSelectOption>
                {filterOptions.statuses.map((value) => <NativeSelectOption key={value} value={value}>{value}</NativeSelectOption>)}
              </NativeSelect>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] border-collapse text-left">
              <thead><tr className="border-b border-[#e8e9ec] bg-[#fafafa]">{['Проект', 'Задача', 'Исполнитель', 'Дедлайн', 'Статус', 'Комментарий'].map((label) => <th key={label} scope="col" className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.095em] text-[#7a7e87] first:pl-6 last:pr-6">{label}</th>)}</tr></thead>
              <tbody>
                {filteredTasks.map((task, index) => {
                  const overdue = isTaskOverdue(task);
                  return (
                  <tr key={`${task.task}-${index}`} className={`border-b border-[#eceef1] last:border-0 ${overdue ? 'bg-[#fff8f7]' : ''}`}>
                    <td className={`w-[15%] px-5 py-5 pl-6 align-middle text-[14px] font-medium text-[#555962] ${overdue ? 'shadow-[inset_3px_0_0_#df6859]' : ''}`}>{task.project}</td>
                    <td className="w-[24%] px-5 py-5 align-middle text-[14px] font-semibold text-[#26272b]">{task.task}</td>
                    <td className="w-[16%] px-5 py-5 align-middle"><div className="flex items-center gap-3"><span className={`grid size-8 shrink-0 place-items-center rounded-full text-[11px] font-bold ${task.avatar}`}>{task.initials}</span><span className="text-[14px] font-medium text-[#3f4249]">{task.assignee}</span></div></td>
                    <td className="w-[13%] px-5 py-5 align-middle text-[14px] text-[#555962]">
                      <div className="flex flex-col items-start gap-1.5">
                        <span>{task.deadline}</span>
                        {overdue && <span className="inline-flex rounded-full bg-[#fee7e4] px-2 py-1 text-[11px] font-semibold text-[#aa3d31]">Просрочено</span>}
                      </div>
                    </td>
                    <td className="w-[13%] px-5 py-5 align-middle"><span className={`inline-flex rounded-full px-3 py-1.5 text-[12px] font-semibold ${task.statusStyle}`}>{task.status}</span></td>
                    <td className="w-[19%] px-5 py-5 pr-6 align-middle text-[14px] leading-5 text-[#666a73]">{task.comment}</td>
                  </tr>
                  );
                })}
                {filteredTasks.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-14 text-center text-sm text-[#777b84]">Задач с выбранными параметрами нет</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
