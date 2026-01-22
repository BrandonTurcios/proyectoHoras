import React, { useState, useEffect, useRef } from 'react';
import ModalChangeArea from './ModalChangeArea';

function Dropdown({items = []}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  },[]);

  return (
    <div ref={dropdownRef} className="relative inline-block font-[Poppins] h-auto ">
      <button className="font-bold text-xl" onClick={toggleDropdown}>
        ...
       <i className={`${isOpen ? 'border border-white border' : ''}`} ></i>
      </button>
      {isOpen && (
        <div className="absolute z-50 mt-2 bg-gray-50 rounded-md border border-sm border-indigo-100 space-y-2 w-32">
          <div className="px-4 py-2 rounded-md hover:bg-indigo-50 cursor-pointer">
            {items.map((item) => (
              <button className='text-xs text-indigo-700' onClick={() => item.action()}>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dropdown;