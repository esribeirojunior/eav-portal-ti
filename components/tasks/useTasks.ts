import useSWR from 'swr';
import { apiClient } from '../../lib/apiClient';
import { ITTask, ITTaskComment } from '../../types';

// Fetchers
const tasksFetcher = async () => {
    const { data, error } = await apiClient.from('it_tasks').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data as ITTask[];
};

const usersFetcher = async () => {
    const { data, error } = await apiClient.from('authorized_users').select('email');
    if (error) throw error;
    return data as { email: string }[];
};

const commentsFetcher = async (url: string, taskId: string) => {
    const { data, error } = await apiClient.from('it_task_comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });
    if (error) throw error;
    return data as ITTaskComment[];
};

// Hooks
export const useTasks = () => {
    const { data, error, isLoading, mutate } = useSWR('it_tasks', tasksFetcher, {
        revalidateOnFocus: true,
    });

    return {
        tasks: data || [],
        isLoading,
        isError: error,
        mutate
    };
};

export const useSystemUsers = () => {
    const { data, isLoading } = useSWR('system_users', usersFetcher, {
        revalidateOnFocus: false, // Don't need to revalidate users constantly
    });
    
    return { 
        systemUsers: data || [],
        isLoading
    };
};

export const useTaskComments = (taskId: string | undefined) => {
    const { data, error, isLoading, mutate } = useSWR(
        taskId ? ['it_task_comments', taskId] : null,
        ([url, id]) => commentsFetcher(url, id),
        {
            refreshInterval: 5000 // Auto-refresh comments every 5s
        }
    );

    return { 
        comments: data || [], 
        isLoading,
        mutate 
    };
};

// Shared Upload Utility
export const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();
    return data.url;
};
