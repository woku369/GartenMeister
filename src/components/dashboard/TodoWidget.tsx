'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { electronAPI, isElectron } from '@/lib/electron-bridge';
import { Check, Plus, Trash2, RefreshCw } from 'lucide-react';

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: string;
  category?: 'garten' | 'bewasserung' | 'ernte' | 'sonstiges';
}

export default function TodoWidget() {
  const [tasks, setTasks] = useState<TodoItem[]>([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      if (isElectron()) {
        // Wenn in Electron, Aufgaben aus lokaler Datei oder Datenbank laden
        // Beispiel: const savedTasks = await electronAPI.getTasks();
        
        // Simulieren eines asynchronen Ladevorgangs
        setTimeout(() => {
          const savedTasks = getSampleTasks();
          setTasks(savedTasks);
          setLoading(false);
        }, 800);
      } else {
        // Im Browser: Aus localStorage laden oder leere Liste starten
        const savedTasks = localStorage.getItem('gardenTasks');
        if (savedTasks) {
          const parsedTasks = JSON.parse(savedTasks);
          // Filtere alte Beispiel-Tasks heraus (falls vorhanden)
          const cleanTasks = parsedTasks.filter((task: TodoItem) => 
            !['Tomaten gießen', 'Kräuter ernten', 'Frühbeet vorbereiten', 'Unkraut entfernen'].includes(task.text)
          );
          setTasks(cleanTasks);
          // Speichere die bereinigte Liste
          if (cleanTasks.length !== parsedTasks.length) {
            localStorage.setItem('gardenTasks', JSON.stringify(cleanTasks));
          }
        } else {
          setTasks([]);
        }
        setLoading(false);
      }
    } catch (error) {
      console.error("Fehler beim Laden der Aufgaben:", error);
      setTasks([]);
      setLoading(false);
    }
  };

  const saveTasks = async (updatedTasks: TodoItem[]) => {
    try {
      if (isElectron()) {
        // In Electron: In Datei oder Datenbank speichern
        // Beispiel: await electronAPI.saveTasks(updatedTasks);
      } else {
        // Im Browser: In localStorage speichern
        localStorage.setItem('gardenTasks', JSON.stringify(updatedTasks));
      }
    } catch (error) {
      console.error("Fehler beim Speichern der Aufgaben:", error);
    }
  };

  const getSampleTasks = (): TodoItem[] => {
    return [];
  };

  const addTask = () => {
    if (newTask.trim() === '') return;
    
    const task: TodoItem = {
      id: Date.now().toString(),
      text: newTask,
      completed: false
    };
    
    const updatedTasks = [...tasks, task];
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
    setNewTask('');
  };

  const toggleTaskCompletion = (id: string) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === id) {
        return { ...task, completed: !task.completed };
      }
      return task;
    });
    
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
  };

  const deleteTask = (id: string) => {
    const updatedTasks = tasks.filter(task => task.id !== id);
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <Input
          placeholder="Neue Aufgabe hinzufügen..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTask()}
          className="flex-1"
        />
        <Button onClick={addTask}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex space-x-1">
          <Button 
            variant={filter === 'all' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilter('all')}
            className="text-xs"
          >
            Alle
          </Button>
          <Button 
            variant={filter === 'active' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilter('active')}
            className="text-xs"
          >
            Aktiv
          </Button>
          <Button 
            variant={filter === 'completed' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilter('completed')}
            className="text-xs"
          >
            Erledigt
          </Button>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={loadTasks}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <div 
                key={task.id}
                className={`flex items-start justify-between p-2 rounded-md ${
                  task.completed ? 'bg-muted/30' : 'bg-muted/50'
                }`}
              >
                <div className="flex items-start space-x-2">
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => toggleTaskCompletion(task.id)}
                    className="mt-1"
                  />
                  <div>
                    <p className={`text-sm ${
                      task.completed ? 'line-through text-muted-foreground' : ''
                    }`}>
                      {task.text}
                    </p>
                    {task.category && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        getCategoryStyle(task.category)
                      }`}>
                        {getCategoryLabel(task.category)}
                      </span>
                    )}
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => deleteTask(task.id)}
                  className="h-6 w-6 p-0"
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                </Button>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                {filter === 'all' 
                  ? 'Keine Aufgaben vorhanden' 
                  : filter === 'active'
                    ? 'Keine aktiven Aufgaben'
                    : 'Keine erledigten Aufgaben'
                }
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getCategoryLabel(category: string): string {
  switch (category) {
    case 'garten': return 'Garten';
    case 'bewasserung': return 'Bewässerung';
    case 'ernte': return 'Ernte';
    case 'sonstiges': return 'Sonstiges';
    default: return category;
  }
}

function getCategoryStyle(category: string): string {
  switch (category) {
    case 'garten': return 'bg-green-100 text-green-800';
    case 'bewasserung': return 'bg-blue-100 text-blue-800';
    case 'ernte': return 'bg-yellow-100 text-yellow-800';
    case 'sonstiges': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}
