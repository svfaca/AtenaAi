# 🎯 Exemplos Práticos - AtenaAI Next.js

## 1. Criar uma Rota Protegida com Metadados Dinâmicos

```typescript
// app/(protected)/teacher/classes/[id]/page.tsx
import type { Metadata } from 'next';
import { requireRole } from '@/lib/auth/session';

type Params = Promise<{ id: string }>;

export const generateMetadata = async (props: {
  params: Params;
}): Promise<Metadata> => {
  const params = await props.params;
  const classroom = await fetchClassroom(params.id);

  return {
    title: `${classroom.name} - Turmas`,
    description: `Gerenciar turma ${classroom.name}`,
  };
};

export default async function ClassroomPage(props: { params: Params }) {
  const params = await props.params;
  const session = await requireRole('teacher');

  const classroom = await fetchClassroom(params.id);

  // Validar que o professor é proprietário
  if (classroom.teacherId !== session.userId) {
    notFound();
  }

  return (
    <div>
      <h1>{classroom.name}</h1>
      <p>Total de alunos: {classroom.studentCount}</p>
    </div>
  );
}

async function fetchClassroom(id: string) {
  // Substituir por chamada real ao backend
  return {
    id,
    name: `Turma ${id}`,
    teacherId: '123',
    studentCount: 25,
  };
}
```

---

## 2. Formulário com Validação e Loading State

```typescript
// components/features/CreateClassroomForm.tsx
'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

interface CreateClassroomFormProps {
  teacherId: string;
}

export function CreateClassroomForm({ teacherId }: CreateClassroomFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/classrooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          teacherId,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar turma');
      }

      const newClassroom = await response.json();
      toast.success('Turma criada com sucesso!');
      router.push(`/teacher/classes/${newClassroom.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Criar Nova Turma">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nome da Turma"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="Ex: Turma A - Matemática"
        />

        <Input
          label="Disciplina"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          placeholder="Ex: Matemática"
        />

        <Input
          label="Descrição"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Descrição opcional da turma"
        />

        <Button type="submit" isLoading={loading} className="w-full">
          Criar Turma
        </Button>
      </form>
    </Card>
  );
}
```

---

## 3. Layout Aninhado com Contexto

```typescript
// app/(protected)/scholar/layout.tsx
import type { ReactNode } from 'react';
import { requireRole } from '@/lib/auth/session';
import { StudentNav } from '@/components/layout/StudentNav';

export default async function ScholarLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireRole('scholar');

  return (
    <div>
      <StudentNav session={session} />
      <div className="p-6">{children}</div>
    </div>
  );
}

// app/(protected)/scholar/classes/layout.tsx
import type { ReactNode } from 'react';

export default function ClassesLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Minhas Turmas</h1>
      {children}
    </div>
  );
}
```

---

## 4. Usar API Client Tipado

```typescript
// Exemplo em um Server Component ou Route Handler
import { apiClient } from '@/lib/api/client';
import type { Classroom, User } from '@/lib/types/entities';

export default async function MyClassesPage() {
  try {
    // GET
    const classrooms: Classroom[] = await apiClient.get(
      '/api/v1/classrooms'
    );

    // POST
    const newClassroom = await apiClient.post('/api/v1/classrooms', {
      name: 'Nova Turma',
      description: 'Descrição',
    });

    // PUT
    const updated = await apiClient.put(
      `/api/v1/classrooms/${classrooms[0].id}`,
      { name: 'Turma Atualizada' }
    );

    // DELETE
    await apiClient.delete(`/api/v1/classrooms/${classrooms[0].id}`);

    return (
      <div>
        {classrooms.map((classroom) => (
          <div key={classroom.id}>{classroom.name}</div>
        ))}
      </div>
    );
  } catch (error) {
    console.error('Erro ao buscar turmas:', error);
    return <div>Erro ao carregar turmas</div>;
  }
}
```

---

## 5. Paginação Server-Side

```typescript
// app/(protected)/teacher/reports/page.tsx
import { Suspense } from 'react';
import { requireRole } from '@/lib/auth/session';
import type { PaginatedResponse } from '@/lib/types/api';
import type { StudentReport } from '@/lib/types/entities';

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function ReportsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const page = parseInt(searchParams.page || '1');

  const session = await requireRole('teacher');

  return (
    <Suspense fallback={<div>Carregando relatórios...</div>}>
      <ReportsList teacherId={session.userId} page={page} />
    </Suspense>
  );
}

async function ReportsList({
  teacherId,
  page,
}: {
  teacherId: string;
  page: number;
}) {
  try {
    const response: PaginatedResponse<StudentReport> = await fetch(
      `${process.env.BACKEND_URL}/api/v1/reports?page=${page}&teacherId=${teacherId}`,
      { credentials: 'include' }
    ).then((r) => r.json());

    const { data, pagination } = response;

    return (
      <div>
        <h1>Relatórios de Alunos</h1>

        <div className="space-y-4">
          {data.map((report) => (
            <div
              key={report.id}
              className="bg-white p-4 rounded border"
            >
              <p>Aluno: {report.studentId}</p>
              <p>Progresso: {report.progress}%</p>
            </div>
          ))}
        </div>

        <nav className="mt-6 flex gap-2">
          {page > 1 && (
            <a href={`?page=${page - 1}`} className="px-4 py-2 bg-blue-600 text-white rounded">
              Anterior
            </a>
          )}

          <span className="px-4 py-2">
            Página {pagination.page} de {pagination.pages}
          </span>

          {page < pagination.pages && (
            <a href={`?page=${page + 1}`} className="px-4 py-2 bg-blue-600 text-white rounded">
              Próxima
            </a>
          )}
        </nav>
      </div>
    );
  } catch (error) {
    return <div>Erro ao carregar relatórios</div>;
  }
}
```

---

## 6. Action Servers para Operações Simples (Próximo: React 19)

```typescript
// lib/actions/classrooms.ts (Será usado com 'use server')
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth/session';

export async function deleteClassroom(classroomId: string) {
  const session = await requireRole('teacher');

  try {
    const response = await fetch(
      `${process.env.BACKEND_URL}/api/v1/classrooms/${classroomId}`,
      {
        method: 'DELETE',
        credentials: 'include',
      }
    );

    if (!response.ok) {
      throw new Error('Erro ao deletar turma');
    }

    // Revalidar cache
    revalidatePath('/teacher/classes');
  } catch (error) {
    throw new Error('Falha ao deletar turma');
  }
}

// components/ClassroomCard.tsx
'use client';

import { deleteClassroom } from '@/lib/actions/classrooms';

export function ClassroomCard({ classroom }) {
  const handleDelete = async () => {
    if (confirm('Tem certeza?')) {
      await deleteClassroom(classroom.id);
    }
  };

  return (
    <div >
      <h3>{classroom.name}</h3>
      <button onClick={handleDelete}>
        Deletar
      </button>
    </div>
  );
}
```

---

## 7. Tratamento de Erros Customizado

```typescript
// app/(protected)/teacher/error.tsx
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export default function TeacherError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Teacher page error:', error);
  }, [error]);

  if (error.message === 'FORBIDDEN') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
          <p className="mb-6">Você não tem permissão para acessar esta página</p>
          <Button onClick={() => window.location.href = '/'}>
            Voltar para Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Algo deu errado</h1>
        <p className="mb-6">{error.message}</p>
        <Button onClick={reset}>Tentar Novamente</Button>
      </div>
    </div>
  );
}
```

---

**Estes são padrões profissionais prontos para produção! 🚀**
