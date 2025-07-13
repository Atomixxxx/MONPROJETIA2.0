import { useEffect, useRef } from 'react';
import { ProjectFile } from '../types';

export const useAutoSave = (
  file: ProjectFile | null,
  content: string,
  onSave: (content: string) => void,
  interval: number = 30000 // 30 secondes
) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContentRef = useRef<string>('');

  useEffect(() => {
    if (file) {
      lastSavedContentRef.current = file.content;
    }
  }, [file]);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (content !== lastSavedContentRef.current) {
      timeoutRef.current = setTimeout(() => {
        onSave(content);
        lastSavedContentRef.current = content;
      }, interval);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [content, onSave, interval]);

  const saveNow = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    onSave(content);
    lastSavedContentRef.current = content;
  };

  return { saveNow };
};