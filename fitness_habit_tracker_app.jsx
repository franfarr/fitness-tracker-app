import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Activity, CalendarCheck2, Plus, Settings, Trash2, TrendingDown, TrendingUp, Moon, Footprints, Flame, Beef, Wheat, Droplets, Pencil } from "lucide-react";

const STORAGE_KEY = "kaizen-tracker-v1";

const defaultState = {
  profile: {
    title: "Fitness Tracker",
    accent: "blue",
  },
  trackerFields: [
    { id: "bw", label: "Bodyweight", short: "BW", unit: "kg", type: "number", enabled: true },
    { id: "calories", label: "Calories", short: "Cals", unit: "kcal", type: "number", enabled: true },
    { id: "protein", label: "Protein", short: "Protein", unit: "g", type: "number", enabled: true },
    { id: "carbs", label: "Carbs", short: "Carbs", unit: "g", type: "number", enabled: true },
    { id: "fat", label: "Fat", short: "Fat", unit: "g", type: "number", enabled: true },
    { id: "sleep", label: "Sleep", short: "Sleep", unit: "hrs", type: "number", enabled: true },
    { id: "steps", label: "Steps", short: "Steps", unit: "steps", type: "number", enabled: true },
    { id: "water", label: "Water", short: "Water", unit: "L", type: "number", enabled: false },
  ],
  dailyHabits: [
    { id: "d1", name: "Game of rings" },
    { id: "d2", name: "Read 15 minutes" },
    { id: "d3", name: "Multivitamins + creatine" },
    { id: "d4", name: "Irish lesson" },
    { id: "d5", name: "10k steps" },
    { id: "d6", name: "3L water + electrolytes" },
    { id: "d7", name: "Bedtime routine" },
    { id: "d8", name: ">7.5 hours sleep" },
    { id: "d9", name: "No alcohol" },
    { id: "d10", name: "Lunch made for tomorrow" },
  ],
  weeklyHabits: [
    { id: "w1", name: "Weekly food shop" },
    { id: "w2", name: "2 or more gym sessions" },
    { id: "w3", name: "1 or more 5k runs" },
    { id: "w4", name: "Bring Kayden out" },
    { id: "w5", name: "Date night / movie night" },
    { id: "w6", name: "See friends" },
    { id: "w7", name: "Family video calls" },
  ],
  entries: {},
  weeklyChecks: {},
};

const accentClasses = {
  blue: "from-sky-500 to-blue-600",
  emerald: "from-emerald-500 to-teal-600",
  violet: "from-violet-500 to-indigo-600",
  orange: "from-orange-500 to-amber-500",
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : defaultState;
  } catch {
    return defaultState;
  }
}

function formatDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function getStartOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekKey(date = new Date()) {
  return formatDateKey(getStartOfWeek(date));
}

function prettyDate(dateKey) {
  const d = new Date(dateKey);
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

function dayName(dateKey) {
  const d = new Date(dateKey);
  return d.toLocaleDateString(undefined, { weekday: "long" });
}

function getDateRange(days = 14) {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    return formatDateKey(d);
  });
}

function calcPercent(done, total) {
  if (!total) return 0;
  return Math.round((done / total) * 100);
}

function statChange(current, previous) {
  if (current == null || previous == null || Number.isNaN(current) || Number.isNaN(previous)) return null;
  return +(current - previous).toFixed(1);
}

function getFieldIcon(fieldId) {
  switch (fieldId) {
    case "calories":
      return Flame;
    case "protein":
      return Beef;
    case "carbs":
      return Wheat;
    case "sleep":
      return Moon;
    case "steps":
      return Footprints;
    case "water":
      return Droplets;
    default:
      return Activity;
  }
}

function average(values) {
  const nums = values.filter((v) => typeof v === "number" && !Number.isNaN(v));
  if (!nums.length) return null;
  return +(nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1);
}

function AppShell({ children }) {
  return <div className="min-h-screen bg-zinc-950 text-zinc-50">{children}</div>;
}

function MetricCard({ title, value, subtitle, icon: Icon, trend }) {
  return (
    <Card className="border-zinc-800 bg-zinc-900/80 shadow-2xl rounded-3xl">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-zinc-300">{title}</p>
            <div className="mt-2 text-3xl font-bold tracking-tight text-white" style={{ color: "#ffffff" }}>{value}</div>
            {subtitle ? <p className="mt-1 text-sm text-zinc-200">{subtitle}</p> : null}
          </div>
          <div className="rounded-2xl bg-zinc-800 p-3">
            <Icon className="h-5 w-5 text-zinc-200" />
          </div>
        </div>
        {trend ? <p className="mt-3 text-sm text-zinc-300">{trend}</p> : null}
      </CardContent>
    </Card>
  );
}

function EditListDialog({ title, items, onSave }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(items);

  useEffect(() => setDraft(items), [items, open]);

  const updateItem = (id, name) => {
    setDraft((prev) => prev.map((item) => (item.id === id ? { ...item, name } : item)));
  };

  const addItem = () => {
    setDraft((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, name: "New habit" }]);
  };

  const removeItem = (id) => {
    setDraft((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800 rounded-2xl">
          <Pencil className="mr-2 h-4 w-4" /> Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg rounded-3xl border-zinc-800 bg-zinc-950 text-zinc-50">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-auto pr-1">
          {draft.map((item, idx) => (
            <div key={item.id} className="flex items-center gap-2">
              <div className="w-7 text-sm text-zinc-200">{idx + 1}.</div>
              <Input
                value={item.name}
                onChange={(e) => updateItem(item.id, e.target.value)}
                className="rounded-2xl border-zinc-800 bg-zinc-900"
              />
              <Button size="icon" variant="ghost" onClick={() => removeItem(item.id)} className="rounded-2xl text-zinc-300 hover:text-red-400 hover:bg-zinc-900">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3 pt-2">
          <Button onClick={addItem} variant="secondary" className="rounded-2xl bg-zinc-800 hover:bg-zinc-700">
            <Plus className="mr-2 h-4 w-4" /> Add habit
          </Button>
          <Button
            onClick={() => {
              onSave(draft.filter((item) => item.name.trim()));
              setOpen(false);
            }}
            className="rounded-2xl"
          >
            Save changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function FitnessHabitTrackerApp() {
  const [state, setState] = useState(defaultState);
  const [todayKey, setTodayKey] = useState(formatDateKey());
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setState(loadState());
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const accent = accentClasses[state.profile.accent] || accentClasses.blue;
  const todayEntry = state.entries[todayKey] || { metrics: {}, habits: {}, notes: "" };
  const currentWeekKey = getWeekKey(new Date(todayKey));
  const currentWeekChecks = state.weeklyChecks[currentWeekKey] || {};

  useEffect(() => {
    setNotes(todayEntry.notes || "");
  }, [todayKey, todayEntry.notes]);

  const enabledFields = state.trackerFields.filter((f) => f.enabled);

  const dailyDone = state.dailyHabits.filter((h) => todayEntry.habits?.[h.id]).length;
  const dailyPercent = calcPercent(dailyDone, state.dailyHabits.length);
  const weeklyDone = state.weeklyHabits.filter((h) => currentWeekChecks?.[h.id]).length;
  const weeklyPercent = calcPercent(weeklyDone, state.weeklyHabits.length);

  const dates14 = getDateRange(14);
  const chartData = dates14.map((dateKey) => ({
    date: new Date(dateKey).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    bw: state.entries[dateKey]?.metrics?.bw || null,
  }));

  const last7 = getDateRange(7);
  const prev7 = getDateRange(14).slice(0, 7);

  const currentWeightAvg = average(last7.map((d) => Number(state.entries[d]?.metrics?.bw)));
  const previousWeightAvg = average(prev7.map((d) => Number(state.entries[d]?.metrics?.bw)));
  const weightDiff = statChange(currentWeightAvg, previousWeightAvg);

  const metricAverages = useMemo(() => {
    return enabledFields.map((field) => ({
      ...field,
      avg: average(last7.map((d) => Number(state.entries[d]?.metrics?.[field.id]))),
    }));
  }, [enabledFields, state.entries]);

  const startWeight = (() => {
    const entries = Object.entries(state.entries)
      .filter(([, value]) => value?.metrics?.bw != null && value.metrics.bw !== "")
      .sort(([a], [b]) => a.localeCompare(b));
    if (!entries.length) return null;
    return Number(entries[0][1].metrics.bw);
  })();

  const currentWeight = todayEntry.metrics?.bw ? Number(todayEntry.metrics.bw) : currentWeightAvg;
  const totalWeightChange = startWeight != null && currentWeight != null ? +(currentWeight - startWeight).toFixed(1) : null;

  const saveMetric = (fieldId, value) => {
    setState((prev) => ({
      ...prev,
      entries: {
        ...prev.entries,
        [todayKey]: {
          ...(prev.entries[todayKey] || { metrics: {}, habits: {}, notes: "" }),
          metrics: {
            ...(prev.entries[todayKey]?.metrics || {}),
            [fieldId]: value,
          },
          habits: prev.entries[todayKey]?.habits || {},
          notes: prev.entries[todayKey]?.notes || "",
        },
      },
    }));
  };

  const saveNotes = () => {
    setState((prev) => ({
      ...prev,
      entries: {
        ...prev.entries,
        [todayKey]: {
          ...(prev.entries[todayKey] || { metrics: {}, habits: {}, notes: "" }),
          metrics: prev.entries[todayKey]?.metrics || {},
          habits: prev.entries[todayKey]?.habits || {},
          notes,
        },
      },
    }));
  };

  const toggleDailyHabit = (habitId) => {
    setState((prev) => ({
      ...prev,
      entries: {
        ...prev.entries,
        [todayKey]: {
          ...(prev.entries[todayKey] || { metrics: {}, habits: {}, notes: "" }),
          metrics: prev.entries[todayKey]?.metrics || {},
          notes: prev.entries[todayKey]?.notes || "",
          habits: {
            ...(prev.entries[todayKey]?.habits || {}),
            [habitId]: !(prev.entries[todayKey]?.habits || {})[habitId],
          },
        },
      },
    }));
  };

  const toggleWeeklyHabit = (habitId) => {
    setState((prev) => ({
      ...prev,
      weeklyChecks: {
        ...prev.weeklyChecks,
        [currentWeekKey]: {
          ...(prev.weeklyChecks[currentWeekKey] || {}),
          [habitId]: !(prev.weeklyChecks[currentWeekKey] || {})[habitId],
        },
      },
    }));
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-md p-3 sm:p-4 md:max-w-2xl md:p-6 xl:max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-[2rem] bg-gradient-to-r ${accent} p-[1px] shadow-2xl`}
        >
          <div className="rounded-[2rem] bg-zinc-950/95 p-6 md:p-8">
            <div className="flex flex-col gap-5">
              <div>
                <Badge className="mb-4 rounded-full bg-zinc-800 px-4 py-1 text-zinc-200">Mobile habit and fitness tracker</Badge>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight">{state.profile.title}</h1>
                <p className="mt-3 max-w-2xl text-sm md:text-base text-zinc-300">
                  Built for phone use first, with editable checklists, quick daily input, and simple progress comparisons.
                </p>
              </div>
              <div className="grid w-full grid-cols-2 gap-3">
                <Card className="rounded-3xl border-zinc-800 bg-zinc-900/80">
                  <CardContent className="p-4">
                    <p className="text-sm text-zinc-300">Today</p>
                    <p className="mt-1 text-lg font-semibold text-white">{dayName(todayKey)}</p>
                    <p className="text-sm text-zinc-200">{prettyDate(todayKey)}</p>
                  </CardContent>
                </Card>
                <Card className="rounded-3xl border-zinc-800 bg-zinc-900/80">
                  <CardContent className="p-4">
                    <p className="text-sm text-zinc-300">This week</p>
                    <p className="mt-1 text-lg font-semibold text-white">{weeklyPercent}% complete</p>
                    <p className="text-sm text-zinc-200">Weekly habit score</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </motion.div>

        <Tabs defaultValue="dashboard" className="mt-6">
          <TabsList className="grid h-auto w-full grid-cols-3 gap-2 rounded-3xl border border-zinc-800 bg-zinc-900 p-2 shadow-lg">
            <TabsTrigger className="rounded-2xl text-zinc-200 data-[state=active]:bg-white data-[state=active]:text-black" value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger className="rounded-2xl text-zinc-200 data-[state=active]:bg-white data-[state=active]:text-black" value="checkin">Daily Check-In</TabsTrigger>
            <TabsTrigger className="rounded-2xl text-zinc-200 data-[state=active]:bg-white data-[state=active]:text-black" value="daily">Daily Habits</TabsTrigger>
            <TabsTrigger className="rounded-2xl text-zinc-200 data-[state=active]:bg-white data-[state=active]:text-black" value="weekly">Weekly Habits</TabsTrigger>
            <TabsTrigger className="rounded-2xl text-zinc-200 data-[state=active]:bg-white data-[state=active]:text-black" value="progress">Progress</TabsTrigger>
            <TabsTrigger className="rounded-2xl text-zinc-200 data-[state=active]:bg-white data-[state=active]:text-black" value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-5 space-y-5">
            <div className="grid gap-3">
              <MetricCard title="Daily habits" value={`${dailyDone}/${state.dailyHabits.length}`} subtitle={`${dailyPercent}% complete today`} icon={CalendarCheck2} trend="Tap into Daily Habits to complete tonight's checklist" />
              <MetricCard title="Weekly habits" value={`${weeklyDone}/${state.weeklyHabits.length}`} subtitle={`${weeklyPercent}% complete this week`} icon={Settings} trend="Weekly tracker resets with a new week" />
              <MetricCard
                title="Current weight"
                value={currentWeight != null ? `${currentWeight} kg` : "-"}
                subtitle={startWeight != null ? `Started at ${startWeight} kg` : "Add bodyweight entries to compare"}
                icon={weightDiff != null && weightDiff <= 0 ? TrendingDown : TrendingUp}
                trend={
                  totalWeightChange != null
                    ? `${totalWeightChange < 0 ? "Down" : "Up"} ${Math.abs(totalWeightChange)} kg overall`
                    : "No comparison yet"
                }
              />
              <MetricCard
                title="7-day average"
                value={currentWeightAvg != null ? `${currentWeightAvg} kg` : "-"}
                subtitle="Average bodyweight over the last 7 days"
                icon={Activity}
                trend={
                  weightDiff != null
                    ? `${weightDiff < 0 ? "Down" : "Up"} ${Math.abs(weightDiff)} kg vs previous 7 days`
                    : "Need more entries to compare"
                }
              />
            </div>

            <div className="grid gap-5">
              <Card className="rounded-3xl border-zinc-800 bg-zinc-900/80 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-xl">Weight trend</CardTitle>
                </CardHeader>
                <CardContent className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="date" stroke="#a1a1aa" tick={{ fontSize: 12 }} />
                      <YAxis stroke="#a1a1aa" tick={{ fontSize: 12 }} domain={["auto", "auto"]} />
                      <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 16 }} />
                      <Line type="monotone" dataKey="bw" stroke="currentColor" strokeWidth={3} className="text-sky-400" dot={{ r: 4 }} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-zinc-800 bg-zinc-900/80 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-xl text-white">This week at a glance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {metricAverages.slice(0, 6).map((field) => {
                    const Icon = getFieldIcon(field.id);
                    return (
                      <div key={field.id} className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-black p-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-2xl bg-zinc-800 p-2">
                            <Icon className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <p className="text-sm text-zinc-100">{field.label}</p>
                            <p className="font-medium text-zinc-300">7-day average</p>
                          </div>
                        </div>
                        <div className="text-right font-semibold text-white">{field.avg != null ? `${field.avg} ${field.unit}` : "-"}</div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="checkin" className="mt-5 space-y-5">
            <Card className="rounded-3xl border-zinc-800 bg-zinc-900/80 shadow-2xl">
              <CardHeader className="flex flex-col gap-4">
                <div>
                  <CardTitle className="text-xl">Daily Check-In</CardTitle>
                  <p className="mt-1 text-sm text-zinc-300">Enter tonight's bodyweight, food, sleep, steps, and any extra notes.</p>
                </div>
                <Input type="date" value={todayKey} onChange={(e) => setTodayKey(e.target.value)} className="max-w-[220px] rounded-2xl border-zinc-800 bg-zinc-950" />
              </CardHeader>
              <CardContent className="grid gap-3">
                {enabledFields.map((field) => {
                  const Icon = getFieldIcon(field.id);
                  return (
                    <div key={field.id} className="rounded-3xl border border-zinc-800 bg-zinc-950 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <Label className="text-sm text-zinc-300">{field.label}</Label>
                          <div className="text-xs text-zinc-200">{field.unit || "value"}</div>
                        </div>
                        <div className="rounded-2xl bg-zinc-900 p-2"><Icon className="h-4 w-4 text-zinc-300" /></div>
                      </div>
                      <Input
                        type={field.type}
                        value={todayEntry.metrics?.[field.id] ?? ""}
                        onChange={(e) => saveMetric(field.id, e.target.value)}
                        placeholder={`Enter ${field.short.toLowerCase()}`}
                        className="rounded-2xl border-zinc-800 bg-zinc-900 text-lg"
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-zinc-800 bg-zinc-900/80 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-xl">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anything to note tonight? Hunger, energy, workout, recovery, mood..."
                  className="min-h-[140px] w-full rounded-3xl border border-zinc-800 bg-zinc-950 p-4 text-sm outline-none"
                />
                <div className="mt-4 flex justify-end">
                  <Button className="rounded-2xl" onClick={saveNotes}>Save notes</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="daily" className="mt-5 space-y-5">
            <div className="flex flex-col gap-3">
              <div>
                <h2 className="text-2xl font-bold text-white">Daily Habits</h2>
                <p className="text-sm text-zinc-300">Tick off habits for the selected day and keep the list editable.</p>
              </div>
              <EditListDialog title="Edit daily habits" items={state.dailyHabits} onSave={(items) => setState((prev) => ({ ...prev, dailyHabits: items }))} />
            </div>
            <Card className="rounded-3xl border-zinc-800 bg-zinc-900/80 shadow-2xl">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-zinc-300">Today’s score</p>
                    <p className="text-2xl font-bold text-white">{dailyDone} / {state.dailyHabits.length}</p>
                  </div>
                  <div className="w-40">
                    <Progress value={dailyPercent} className="h-3 rounded-full" />
                    <p className="mt-2 text-right text-sm text-zinc-300">{dailyPercent}% complete</p>
                  </div>
                </div>
                <div className="grid gap-3">
                  {state.dailyHabits.map((habit, index) => (
                    <button
                      key={habit.id}
                      onClick={() => toggleDailyHabit(habit.id)}
                      className={`flex items-center justify-between rounded-3xl border p-4 text-left transition ${todayEntry.habits?.[habit.id] ? "border-emerald-400 bg-emerald-500/15" : "border-zinc-800 bg-zinc-950 hover:bg-zinc-900"}`}
                    >
                      <div>
                        
                        <p className="font-medium text-zinc-100">{habit.name}</p>
                      </div>
                      <Checkbox checked={!!todayEntry.habits?.[habit.id]} className="h-6 w-6 rounded-md data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500" />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="weekly" className="mt-5 space-y-5">
            <div className="flex flex-col gap-3">
              <div>
                <h2 className="text-2xl font-bold text-white">Weekly Habits</h2>
                <p className="text-sm text-zinc-300">Use this for the big weekly wins instead of ticking boxes in a spreadsheet.</p>
              </div>
              <EditListDialog title="Edit weekly habits" items={state.weeklyHabits} onSave={(items) => setState((prev) => ({ ...prev, weeklyHabits: items }))} />
            </div>
            <Card className="rounded-3xl border-zinc-800 bg-zinc-900/80 shadow-2xl">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-zinc-300">Week starting</p>
                    <p className="text-2xl font-bold text-white">{prettyDate(currentWeekKey)}</p>
                  </div>
                  <div className="w-40">
                    <Progress value={weeklyPercent} className="h-3 rounded-full" />
                    <p className="mt-2 text-right text-sm text-zinc-300">{weeklyPercent}% complete</p>
                  </div>
                </div>
                <div className="grid gap-3">
                  {state.weeklyHabits.map((habit, index) => (
                    <button
                      key={habit.id}
                      onClick={() => toggleWeeklyHabit(habit.id)}
                      className={`flex items-center justify-between rounded-3xl border p-4 text-left transition ${currentWeekChecks?.[habit.id] ? "border-emerald-500 bg-emerald-500/10" : "border-zinc-800 bg-zinc-950 hover:bg-zinc-900"}`}
                    >
                      <div>
                        
                        <p className="font-medium text-zinc-100">{habit.name}</p>
                      </div>
                      <Checkbox checked={!!currentWeekChecks?.[habit.id]} className="h-6 w-6 rounded-md data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500" />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress" className="mt-5 space-y-5">
            <div className="grid gap-3">
              {metricAverages.map((field) => (
                <Card key={field.id} className="rounded-3xl border-zinc-800 bg-zinc-900/80">
                  <CardContent className="p-5">
                    <p className="text-sm text-zinc-300">{field.label}</p>
                    <p className="mt-2 text-3xl font-bold">{field.avg != null ? field.avg : "-"}</p>
                    <p className="mt-1 text-sm text-zinc-200">7-day average {field.unit ? `(${field.unit})` : ""}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="rounded-3xl border-zinc-800 bg-zinc-900/80 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-xl">Last 14 days of bodyweight</CardTitle>
              </CardHeader>
              <CardContent className="h-[340px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="date" stroke="#a1a1aa" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#a1a1aa" tick={{ fontSize: 12 }} domain={["auto", "auto"]} />
                    <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 16 }} />
                    <Line type="monotone" dataKey="bw" stroke="currentColor" strokeWidth={3} className="text-violet-400" dot={{ r: 4 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-5 space-y-5">
            <Card className="rounded-3xl border-zinc-800 bg-zinc-900/80 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-xl">App Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-sm text-zinc-300">App title</Label>
                  <Input
                    value={state.profile.title}
                    onChange={(e) => setState((prev) => ({ ...prev, profile: { ...prev.profile, title: e.target.value } }))}
                    className="mt-2 max-w-md rounded-2xl border-zinc-800 bg-zinc-950"
                  />
                </div>

                <Separator className="bg-zinc-800" />

                <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-4">
                  <h3 className="text-lg font-semibold text-zinc-100">Tracker fields</h3>
                  <p className="mt-1 text-sm text-zinc-300">Turn fields on or off. The app already includes carbs and fat, and more can be added later.</p>
                  <div className="mt-4 grid gap-3">
                    {state.trackerFields.map((field) => (
                      <div key={field.id} className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                        <div>
                          <p className="font-medium text-zinc-100">{field.label}</p>
                          <p className="text-sm text-zinc-200">{field.unit || "No unit"}</p>
                        </div>
                        <Switch
                          checked={field.enabled}
                          onCheckedChange={(checked) =>
                            setState((prev) => ({
                              ...prev,
                              trackerFields: prev.trackerFields.map((item) =>
                                item.id === field.id ? { ...item, enabled: checked } : item
                              ),
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className="bg-zinc-800" />

                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-3xl border border-zinc-800 bg-zinc-950 p-4">
                    <div>
                      <p className="font-medium text-zinc-100">Daily Habits</p>
                      <p className="text-sm text-zinc-200">Rename, add, or remove daily checklist items.</p>
                    </div>
                    <EditListDialog title="Edit daily habits" items={state.dailyHabits} onSave={(items) => setState((prev) => ({ ...prev, dailyHabits: items }))} />
                  </div>
                  <div className="flex items-center justify-between rounded-3xl border border-zinc-800 bg-zinc-950 p-4">
                    <div>
                      <p className="font-medium text-zinc-100">Weekly Habits</p>
                      <p className="text-sm text-zinc-200">Rename, add, or remove weekly checklist items.</p>
                    </div>
                    <EditListDialog title="Edit weekly habits" items={state.weeklyHabits} onSave={(items) => setState((prev) => ({ ...prev, weeklyHabits: items }))} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
