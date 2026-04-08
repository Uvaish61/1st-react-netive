export interface Todo {
    id: string;
    title: string
    completed: boolean;
    dueDate: string | null ;
    dueTime: string | null ;
    status: 'pending' | 'completed' | 'overdue';
    completedAt: string | null;
    priority?: 'High' | 'Medium' | 'Low';
    category?: 'Work' | 'Personal' | 'Study';
    completionType?: "early" | "ontime" | "late"
    }
    
