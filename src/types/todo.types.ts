export interface Tag {
    id: string;
    name: string;
    color: string;
}

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
    repeat?: 'none' | 'daily' | 'weekly';
    completionType?: "early" | "ontime" | "late";
    tags?: Tag[];
    }
    
