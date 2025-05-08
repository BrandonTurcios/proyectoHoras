const Schedule = ({ students, tasks }) => {
  // ... existing code ...

  return (
    <div className="space-y-8">
      {/* Filtros */}
      <div className="bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl p-4 sm:p-8">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Estudiante
            </label>
            <select
              className="border-2 border-indigo-200 dark:border-indigo-800 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
            >
              <option value="all">Todos los estudiantes</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.full_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Área
            </label>
            <select
              className="border-2 border-indigo-200 dark:border-indigo-800 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
            >
              <option value="all">Todas las áreas</option>
              {Array.from(new Set(students.map(s => s.internship_area))).map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Calendario */}
      <div className="bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {currentMonth.toLocaleString('es', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
              <div
                key={day}
                className="bg-gray-50 dark:bg-gray-800 p-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {day}
              </div>
            ))}
            {Array.from({ length: firstDayOfMonth }, (_, i) => (
              <div
                key={`empty-${i}`}
                className="bg-white dark:bg-gray-800 p-2 min-h-[100px]"
              />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1);
              const dayTasks = filteredTasks.filter(task => {
                const taskDate = new Date(task.due_date);
                return taskDate.getDate() === date.getDate() &&
                       taskDate.getMonth() === date.getMonth() &&
                       taskDate.getFullYear() === date.getFullYear();
              });

              return (
                <div
                  key={i}
                  className={`bg-white dark:bg-gray-800 p-2 min-h-[100px] ${
                    date.toDateString() === new Date().toDateString()
                      ? 'ring-2 ring-indigo-500 dark:ring-indigo-400'
                      : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className={`text-sm font-medium ${
                      date.toDateString() === new Date().toDateString()
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-gray-900 dark:text-gray-100'
                    }`}>
                      {i + 1}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                        {dayTasks.length}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 space-y-1">
                    {dayTasks.map(task => (
                      <div
                        key={task.id}
                        className={`text-xs p-1 rounded truncate ${
                          task.status === 'approved'
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                            : task.status === 'submitted'
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                            : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                        }`}
                        title={task.title}
                      >
                        {task.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lista de tareas */}
      <div className="bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 sm:p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Tareas del Mes</h2>
          <div className="space-y-4">
            {filteredTasks.map(task => (
              <div
                key={task.id}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {task.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(task.due_date).toLocaleDateString('es', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    task.status === 'approved'
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                      : task.status === 'submitted'
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                      : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                  }`}>
                    {task.status === 'approved' ? 'Aprobada' :
                     task.status === 'submitted' ? 'Enviada' : 'Pendiente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Schedule; 