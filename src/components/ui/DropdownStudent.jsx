import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Trash2, ArrowLeftRight } from 'lucide-react';

function Dropdown({items = []}) {
  const [isOpen, setIsOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const calcPosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const menuW = 176;
    const gap = 4;
    let top = rect.bottom + gap;
    let left = rect.right - menuW;

    if (top + 160 > window.innerHeight) top = rect.top - gap;
    if (top < 0) top = rect.bottom + gap;
    if (left < 8) left = 8;
    if (left + menuW > window.innerWidth - 8) {
      left = window.innerWidth - menuW - 8;
    }

    setPos({ top, left });
  }, []);

  const toggleDropdown = () => {
    if (!isOpen) calcPosition();
    setIsOpen(!isOpen);
  };

  const handleItemClick = (action) => {
    action();
    setIsOpen(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event) => {
      if (
        menuRef.current && !menuRef.current.contains(event.target) &&
        buttonRef.current && !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    const handleScroll = () => { calcPosition(); setIsOpen(false); };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen, calcPosition]);

  const getIcon = (label) => {
    const lower = label.toLowerCase();
    if (lower.includes('cambiar') || lower.includes('área')) return <ArrowLeftRight className="w-3.5 h-3.5" />;
    if (lower.includes('eliminar')) return <Trash2 className="w-3.5 h-3.5" />;
    return null;
  };

  const getColorClass = (label) => {
    const lower = label.toLowerCase();
    if (lower.includes('eliminar')) return 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30';
    return 'text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-900/30';
  };

  return (
    <div className="inline-flex">
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </button>
      {isOpen && (
        <div
          ref={menuRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left }}
          className="z-[9999] w-44 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1"
        >
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => handleItemClick(item.action)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors ${getColorClass(item.label)}`}
            >
              {getIcon(item.label)}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;