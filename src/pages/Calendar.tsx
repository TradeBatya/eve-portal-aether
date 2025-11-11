import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { SideNav } from "@/components/SideNav";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, CalendarDays, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek } from "date-fns";
import { ru } from "date-fns/locale";

interface Operation {
  id: string;
  title: string;
  operation_type: string;
  status: string;
  start_time: string;
  fc_name: string;
  location?: string;
}

const Calendar = () => {
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const { data: operations, isLoading } = useQuery({
    queryKey: ['calendar-operations', selectedDate],
    queryFn: async () => {
      const start = startOfMonth(selectedDate);
      const end = endOfMonth(selectedDate);

      const { data, error } = await supabase
        .from('fleet_operations')
        .select('*')
        .gte('start_time', start.toISOString())
        .lte('start_time', end.toISOString())
        .order('start_time');

      if (error) throw error;
      return data as Operation[];
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const t = {
    en: {
      title: "Operations Calendar",
      subtitle: "View scheduled fleet operations",
      today: "Today",
      previousMonth: "Previous Month",
      nextMonth: "Next Month",
      noOperations: "No operations scheduled",
      fc: "FC",
      location: "Location",
    },
    ru: {
      title: "Календарь операций",
      subtitle: "Просмотр запланированных операций",
      today: "Сегодня",
      previousMonth: "Предыдущий месяц",
      nextMonth: "Следующий месяц",
      noOperations: "Нет запланированных операций",
      fc: "ФК",
      location: "Локация",
    },
  }[language];

  const statusColors = {
    scheduled: "bg-blue-500",
    active: "bg-green-500",
    completed: "bg-gray-500",
    cancelled: "bg-red-500",
  };

  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getOperationsForDay = (day: Date) => {
    return operations?.filter(op => isSameDay(new Date(op.start_time), day)) || [];
  };

  const weekDays = language === 'ru' 
    ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="min-h-screen bg-background">
      <SideNav isOpen={isSideNavOpen} onToggle={() => setIsSideNavOpen(!isSideNavOpen)} />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSideNavOpen(!isSideNavOpen)}
          className="mb-4 lg:hidden"
        >
          <Menu className="h-6 w-6" />
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold font-orbitron flex items-center gap-2">
            <CalendarDays className="w-8 h-8 text-primary" />
            {t.title}
          </h1>
          <p className="text-muted-foreground mt-2">{t.subtitle}</p>
        </div>

        {/* Calendar Controls */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}
          >
            {t.previousMonth}
          </Button>
          
          <h2 className="text-xl font-semibold">
            {format(selectedDate, 'MMMM yyyy', { locale: language === 'ru' ? ru : undefined })}
          </h2>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedDate(new Date())}
            >
              {t.today}
            </Button>
            <Button
              variant="outline"
              onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}
            >
              {t.nextMonth}
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <Card>
          <CardContent className="p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-2">
                {/* Week day headers */}
                {weekDays.map((day) => (
                  <div key={day} className="text-center font-semibold text-sm text-muted-foreground py-2">
                    {day}
                  </div>
                ))}

                {/* Calendar days */}
                {calendarDays.map((day) => {
                  const dayOperations = getOperationsForDay(day);
                  const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
                  const isToday = isSameDay(day, new Date());

                  return (
                    <div
                      key={day.toISOString()}
                      className={`min-h-24 p-2 border rounded-lg ${
                        !isCurrentMonth ? 'bg-muted/20 text-muted-foreground' : 'bg-card'
                      } ${isToday ? 'border-primary border-2' : 'border-border'}`}
                    >
                      <div className="text-right text-sm font-medium mb-1">
                        {format(day, 'd')}
                      </div>
                      <div className="space-y-1">
                        {dayOperations.map((op) => (
                          <div
                            key={op.id}
                            className="text-xs p-1 rounded bg-primary/10 border border-primary/20 cursor-pointer hover:bg-primary/20 transition-colors"
                            onClick={() => navigate('/operations')}
                          >
                            <div className="font-medium truncate">{op.title}</div>
                            <div className="text-muted-foreground">
                              {format(new Date(op.start_time), 'HH:mm')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Operations List for Selected Month */}
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">
            {language === 'en' ? 'Scheduled Operations' : 'Запланированные операции'}
          </h2>
          {operations && operations.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {operations.map((op) => (
                <Card key={op.id} className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate('/operations')}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{op.title}</span>
                      <Badge className={statusColors[op.status as keyof typeof statusColors]}>
                        {op.status}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">{t.fc}:</span>
                      <span>{op.fc_name}</span>
                    </div>
                    {op.location && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">{t.location}:</span>
                        <span>{op.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">
                        {format(new Date(op.start_time), 'PPp', { 
                          locale: language === 'ru' ? ru : undefined 
                        })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                {t.noOperations}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Calendar;
