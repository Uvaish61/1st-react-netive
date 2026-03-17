export interface Todo {
    id: string;
    title: string
    completed: boolean;
    dueDate: string | null ;
    dueTime: string | null ;
    status: 'pending' | 'completed' | 'overdue';
    completedAt: string | null;
    completionType?: "early" | "ontime" | "late"
    }
    