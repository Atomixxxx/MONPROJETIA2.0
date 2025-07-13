import { useEffect } from 'react';

const useAutoSave = (data: any, saveFunction: (data: any) => void, delay: number = 1000) => {
    useEffect(() => {
        const handler = setTimeout(() => {
            saveFunction(data);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [data, saveFunction, delay]);
};

export default useAutoSave;