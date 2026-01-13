import { useEffect } from 'react';
import toast from 'react-hot-toast';

export const useRightClickProtection = () => {
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Allow right-click on inputs/textareas so users can paste
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      e.preventDefault();
      
      // Dismiss existing toasts to prevent spamming the screen
      toast.dismiss(); 
      
      // Show the alert
      toast.error('Right click is disabled', {
        id: 'right-click-toast', // Prevents duplicates
        duration: 2000,
        style: {
          background: '#333',
          color: '#fff',
          fontSize: '14px',
        },
        icon: '🔒',
      });
    };

    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);
};