import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PenLine, Plus, Trash2, Check, ArrowLeft, Search, Calendar, Clock, FilterX, AlertTriangle, AlertCircle, ThumbsUp, CalendarDays, ChevronDown, ChevronUp, FileText, BookText, Bookmark, Copy } from "lucide-react";
import { format, addDays } from "date-fns";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { 
  Note, 
  NoteCategory, 
  Priority, 
  NoteDatabaseRow, 
  VALID_CATEGORIES, 
  VALID_PRIORITIES,
  safeCategory,
  safePriority
} from "@/types/Note";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Notes & Tasks page component for admin dashboard
 * Allows creating, organizing, and managing notes for different categories
 */
const NotesPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<NoteCategory>("reviews");
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNotePriority, setNewNotePriority] = useState<Priority>("medium");
  const [newNoteDueDate, setNewNoteDueDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"created" | "due" | "priority">("created");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [userId, setUserId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToToggle, setNoteToToggle] = useState<string | null>(null);
  const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<string[]>([]);
  const [addItemType, setAddItemType] = useState<"note" | "doc">("note");
  const [showPreview, setShowPreview] = useState(false);

  // Fetch notes from Supabase on component mount and tab change
  useEffect(() => {
    checkAdmin();
  }, []);

  // Fetch notes when userId or activeTab changes
  useEffect(() => {
    if (userId) {
      fetchNotes();
    }
  }, [userId, activeTab]);

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/admin");
      return;
    }

    setUserId(session.user.id);

    const { data: isAdmin } = await supabase.rpc('is_admin', {
      user_id: session.user.id
    });

    if (!isAdmin) {
      await supabase.auth.signOut();
      navigate("/admin");
    } else {
      setIsLoading(false);
    }
  };

  // Safe date formatting helper
  const safeFormatDate = (dateStr: string | null, fallback: string = "N/A"): string => {
    if (!dateStr) return fallback;
    try {
      return format(new Date(dateStr), 'MMM d, yyyy');
    } catch (e) {
      console.error("Invalid date format:", dateStr);
      return fallback;
    }
  };

  // Fetch notes from Supabase with improved error handling
  const fetchNotes = async () => {
    try {
      setIsLoading(true);
      
      // Ensure we have a valid user ID
      if (!userId) {
        console.error("No user ID available for fetching notes");
        return;
      }
      
      if (!activeTab || !VALID_CATEGORIES.includes(activeTab)) {
        console.error("Invalid category selected:", activeTab);
        toast.error("Invalid category. Using default.");
        setActiveTab("general"); // Fallback to general tab
        return;
      }
      
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('category', activeTab)
        .eq('user_id', userId) // Filter by the current user's ID
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Convert database types to application types with safe conversions
      const typedNotes = (data || []).map((note: NoteDatabaseRow): Note => ({
        ...note,
        category: safeCategory(note.category),
        priority: safePriority(note.priority)
      }));

      setNotes(typedNotes);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast.error('Failed to load notes. Please try again later.');
      setNotes([]); // Fallback to empty array
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNote = async (category: NoteCategory) => {
    if (!newNoteTitle.trim()) {
      toast.error("Please enter a title for your note");
      return;
    }

    if (!userId) {
      toast.error("You must be logged in to add notes");
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Validate data before sending to Supabase
      if (!VALID_CATEGORIES.includes(category)) {
        toast.error("Invalid category selected");
        return;
      }
      
      const newNote = {
        title: newNoteTitle.trim(),
        content: newNoteContent || "",
        category: category,
        completed: false,
        priority: newNotePriority || "medium",
        due_date: newNoteDueDate?.toISOString() || null,
        user_id: userId
      };
      
      const { data, error } = await supabase
        .from('notes')
        .insert(newNote)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error("No data returned from insert operation");
      }

      // Convert database response to application type with safe conversions
      const typedNote: Note = {
        ...data,
        category: safeCategory(data.category),
        priority: safePriority(data.priority)
      };

      // Only add to notes array if the new note is in the currently active tab
      if (typedNote.category === activeTab) {
        setNotes([typedNote, ...notes]);
      }
      
      // Do not reset the form to allow adding to multiple categories
      toast.success(`Note added to ${category} successfully`);
    } catch (error: any) {
      console.error('Error adding note:', error);
      // More specific error messages based on error type
      if (error.code === "23505") {
        toast.error('This note appears to be a duplicate');
      } else if (error.code?.startsWith("23")) {
        toast.error('Invalid data format');
      } else {
        toast.error('Failed to add note. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleNote = async (id: string) => {
    if (!id) {
      toast.error("Invalid note ID");
      return;
    }
    
    try {
      const noteToUpdate = notes.find(note => note.id === id);
      
      if (!noteToUpdate) {
        toast.error("Note not found");
        return;
      }
      
      if (!noteToUpdate.completed) {
        setNoteToToggle(id);
        setDeleteDialogOpen(true);
        return;
      }
      
      await updateNoteCompletionStatus(id, !noteToUpdate.completed);
      
    } catch (error) {
      console.error('Error updating note:', error);
      toast.error('Failed to update note status');
      // Refresh notes to ensure UI is in sync with database
      fetchNotes();
    }
  };

  const updateNoteCompletionStatus = async (id: string, completionStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({ completed: completionStatus })
        .eq('id', id);

      if (error) {
        throw error;
      }

      setNotes(notes.map(note => 
        note.id === id ? { ...note, completed: completionStatus } : note
      ));
    } catch (error) {
      console.error('Error updating note:', error);
      toast.error('Failed to update note status');
      fetchNotes();
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!id) {
      toast.error("Invalid note ID");
      return;
    }
    
    setNoteToDelete(id);
    setDeleteConfirmDialogOpen(true);
  };

  const confirmDeleteNote = async () => {
    if (!noteToDelete) {
      return;
    }
    
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteToDelete);

      if (error) {
        throw error;
      }

      setNotes(notes.filter(note => note.id !== noteToDelete));
      toast.success("Note deleted successfully");
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    } finally {
      setIsLoading(false);
      setDeleteConfirmDialogOpen(false);
      setNoteToDelete(null);
    }
  };

  const handleUpdatePriority = async (id: string, priority: Priority) => {
    if (!id) {
      toast.error("Invalid note ID");
      return;
    }
    
    // Validate priority
    if (priority !== null && !["high", "medium", "low"].includes(priority)) {
      toast.error("Invalid priority value");
      return;
    }
    
    try {
      const { error } = await supabase
        .from('notes')
        .update({ priority })
        .eq('id', id);

      if (error) {
        throw error;
      }

      setNotes(notes.map(note => 
        note.id === id ? { ...note, priority } : note
      ));
      toast.success("Priority updated");
    } catch (error) {
      console.error('Error updating priority:', error);
      toast.error('Failed to update priority');
      // Refresh notes to ensure UI is in sync with database
      fetchNotes();
    }
  };

  const handleUpdateDueDate = async (id: string, date: Date | null) => {
    if (!id) {
      toast.error("Invalid note ID");
      return;
    }
    
    try {
      // Validate date if not null
      if (date && isNaN(date.getTime())) {
        throw new Error("Invalid date object");
      }
      
      const { error } = await supabase
        .from('notes')
        .update({ due_date: date?.toISOString() || null })
        .eq('id', id);

      if (error) {
        throw error;
      }

      setNotes(notes.map(note => 
        note.id === id ? { ...note, due_date: date?.toISOString() || null } : note
      ));
      toast.success("Due date updated");
    } catch (error) {
      console.error('Error updating due date:', error);
      toast.error('Failed to update due date');
      // Refresh notes to ensure UI is in sync with database
      fetchNotes();
    }
  };

  // Get priority color based on priority level
  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case "high":
        return "text-rose-500";
      case "medium":
        return "text-amber-500";
      case "low":
        return "text-green-500";
      default:
        return "text-muted-foreground";
    }
  };

  // Get icon component based on priority level
  const getPriorityIcon = (priority: Priority) => {
    switch (priority) {
      case "high":
        return <AlertTriangle className="h-4 w-4" />;
      case "medium":
        return <AlertCircle className="h-4 w-4" />;
      case "low":
        return <ThumbsUp className="h-4 w-4" />;
      default:
        return null;
    }
  };

  // Filter and sort notes based on active tab, search query, and filters
  const filteredNotes = notes
    .filter(note => 
      searchQuery === "" || 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter(note => 
      priorityFilter === "all" || note.priority === priorityFilter
    )
    .sort((a, b) => {
      if (sortBy === "created") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === "due") {
        // Handle null due dates - place them at the end
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      } else {
        // Priority sorting (high > medium > low > null)
        const priorityValue = { high: 3, medium: 2, low: 1, null: 0 };
        const aValue = a.priority ? priorityValue[a.priority] : 0;
        const bValue = b.priority ? priorityValue[b.priority] : 0;
        return bValue - aValue;
      }
    });

  // Toggle expanded state for a note
  const toggleNoteExpand = (id: string) => {
    setExpandedNotes(prev => 
      prev.includes(id) 
        ? prev.filter(noteId => noteId !== id) 
        : [...prev, id]
    );
  };

  // Check if a note is expanded
  const isNoteExpanded = (id: string) => expandedNotes.includes(id);

  // Truncate content for preview
  const truncateContent = (content: string, maxLength: number = 200) => {
    if (!content) return "";
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  // Render content based on category and format
  const renderContent = (note: Note, isExpanded: boolean) => {
    const content = isExpanded || note.content.length <= 200 
      ? note.content 
      : truncateContent(note.content);
    
    if (note.category === "docs") {
      return (
        <div className={cn(
          "prose prose-sm dark:prose-invert max-w-none break-words",
          note.completed && "text-muted-foreground line-through"
        )}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </div>
      );
    }
    
    return (
      <p className={cn(
        "text-sm whitespace-pre-line break-words",
        note.completed && "line-through text-muted-foreground"
      )}>
        {content}
      </p>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate("/admin/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold flex items-center">
              <PenLine className="h-5 w-5 mr-2" />
              Notes & Documents
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add New</CardTitle>
            <CardDescription>
              Create a new note, task or document to keep track of your ideas
            </CardDescription>
            <div className="flex mt-2 border-b">
              <div 
                className={`px-4 py-2 font-medium cursor-pointer flex items-center gap-2 ${addItemType === 'note' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => {
                  setAddItemType('note');
                  setShowPreview(false);
                }}
              >
                <BookText className="h-4 w-4" />
                Quick Note/Task
              </div>
              <div 
                className={`px-4 py-2 font-medium cursor-pointer flex items-center gap-2 ${addItemType === 'doc' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setAddItemType('doc')}
              >
                <FileText className="h-4 w-4" />
                Document
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Input
                  placeholder="Title"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  className="font-medium flex-1"
                />
                <div className="flex gap-2">
                  <Select 
                    value={newNotePriority || "medium"} 
                    onValueChange={(value) => setNewNotePriority(value as Priority)}
                  >
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high" className="text-rose-500 font-medium">
                        <div className="flex items-center">
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          High Priority
                        </div>
                      </SelectItem>
                      <SelectItem value="medium" className="text-amber-500 font-medium">
                        <div className="flex items-center">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Medium Priority
                        </div>
                      </SelectItem>
                      <SelectItem value="low" className="text-green-500 font-medium">
                        <div className="flex items-center">
                          <ThumbsUp className="h-4 w-4 mr-2" />
                          Low Priority
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        className={cn(
                          "w-full sm:w-[180px] justify-start text-left font-normal",
                          !newNoteDueDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {newNoteDueDate ? format(newNoteDueDate, "PPP") : "Add due date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <div className="p-3 border-b">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Select due date</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setNewNoteDueDate(null)}
                          >
                            Clear
                          </Button>
                        </div>
                        <div className="flex mt-2 gap-2">
                          <Button size="sm" variant="outline" onClick={() => setNewNoteDueDate(new Date())}>
                            Today
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setNewNoteDueDate(addDays(new Date(), 1))}>
                            Tomorrow
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setNewNoteDueDate(addDays(new Date(), 7))}>
                            Next week
                          </Button>
                        </div>
                      </div>
                      <CalendarComponent
                        mode="single"
                        selected={newNoteDueDate || undefined}
                        onSelect={setNewNoteDueDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {addItemType === 'doc' && (
                <div className="flex justify-between items-center">
                  <div className="text-sm font-medium flex items-center gap-1 text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    Document supports markdown formatting
                  </div>
                  <div className="flex border rounded-md overflow-hidden">
                    <Button
                      type="button"
                      variant={!showPreview ? "default" : "ghost"}
                      size="sm"
                      className="rounded-none"
                      onClick={() => setShowPreview(false)}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant={showPreview ? "default" : "ghost"}
                      size="sm"
                      className="rounded-none"
                      onClick={() => setShowPreview(true)}
                    >
                      Preview
                    </Button>
                  </div>
                </div>
              )}

              {addItemType === 'doc' && showPreview ? (
                <div className="border rounded-md p-4 min-h-[12rem] bg-muted/20">
                  {newNoteContent ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {newNoteContent}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-center h-full flex items-center justify-center">
                      <p>Your document preview will appear here</p>
                    </div>
                  )}
                </div>
              ) : (
                <Textarea
                  placeholder={addItemType === 'note' ? "Quick note content" : "Document content - supports Markdown formatting"}
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  rows={addItemType === 'note' ? 3 : 8}
                  className={addItemType === 'doc' ? "font-mono text-sm" : ""}
                />
              )}

              <div className="flex flex-wrap justify-end gap-2">
                {addItemType === 'note' ? (
                  <>
                    <Button onClick={() => handleAddNote("reviews")} variant="outline" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add to Reviews
                    </Button>
                    <Button onClick={() => handleAddNote("articles")} variant="outline" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add to Articles
                    </Button>
                    <Button onClick={() => handleAddNote("general")} variant="outline" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add to General
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => handleAddNote("docs")} variant={showPreview ? "default" : "outline"} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Save Document
                  </Button>
                )}
              </div>
              <div className="flex justify-between items-center text-xs text-muted-foreground pt-2">
                <span>
                  {addItemType === 'note' 
                    ? "You can add this note to multiple categories" 
                    : ""}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setNewNoteTitle("");
                    setNewNoteContent("");
                    setNewNoteDueDate(null);
                    setNewNotePriority("medium");
                    setShowPreview(false);
                  }}
                  className="text-xs"
                >
                  Clear form
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes and documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-3">
              <div className="flex flex-col items-center gap-2">
                <span className="text-sm text-muted-foreground font-medium text-center">Sort by:</span>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button 
                    variant={sortBy === "created" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setSortBy("created")}
                    className="min-w-20"
                  >
                    <Clock className="h-4 w-4 mr-1" /> 
                    Created
                  </Button>
                  <Button 
                    variant={sortBy === "due" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setSortBy("due")}
                    className="min-w-20"
                  >
                    <Calendar className="h-4 w-4 mr-1" /> 
                    Due Date
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-3">
              <div className="flex flex-col items-center gap-2">
                <span className="text-sm text-muted-foreground font-medium text-center">Filter priority:</span>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button 
                    variant={priorityFilter === "all" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setPriorityFilter("all")}
                    className="min-w-16"
                  >
                    <FilterX className="h-4 w-4 mr-1" />
                    All
                  </Button>
                  <Button 
                    variant={priorityFilter === "high" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setPriorityFilter("high")}
                    className={`min-w-16 ${priorityFilter === "high" ? "" : "text-rose-500"}`}
                  >
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    High
                  </Button>
                  <Button 
                    variant={priorityFilter === "medium" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setPriorityFilter("medium")}
                    className={`min-w-16 ${priorityFilter === "medium" ? "" : "text-amber-500"}`}
                  >
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Medium
                  </Button>
                  <Button 
                    variant={priorityFilter === "low" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setPriorityFilter("low")}
                    className={`min-w-16 ${priorityFilter === "low" ? "" : "text-green-500"}`}
                  >
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    Low
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <Tabs 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as NoteCategory)}
          className="w-full"
        >
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="reviews" className="font-medium">
              Reviews
            </TabsTrigger>
            <TabsTrigger value="articles" className="font-medium">
              Articles
            </TabsTrigger>
            <TabsTrigger value="general" className="font-medium">
              General
            </TabsTrigger>
            <TabsTrigger value="docs" className="font-medium">
              <FileText className="h-4 w-4 mr-1.5" />
              Docs
            </TabsTrigger>
          </TabsList>

          {["reviews", "articles", "general", "docs"].map((category) => (
            <TabsContent key={category} value={category} className="mt-0">
              {isLoading ? (
                <div className="p-8 flex items-center justify-center">
                  <p>Loading notes...</p>
                </div>
              ) : filteredNotes.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center p-8">
                    {category === "docs" ? (
                      <FileText className="h-12 w-12 text-muted-foreground mb-3" />
                    ) : (
                      <PenLine className="h-12 w-12 text-muted-foreground mb-3" />
                    )}
                    <p className="text-muted-foreground">
                      {category === "docs" ? "No documents found" : "No notes found"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {priorityFilter !== "all" 
                        ? `Try changing your priority filter or create a new ${priorityFilter} priority ${category === "docs" ? "document" : "note"}`
                        : category === "docs" 
                          ? "Add your first document above" 
                          : "Add your first note above"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <ScrollArea className="h-[calc(100vh-500px)] min-h-[400px]">
                  <div className="space-y-4 p-1">
                    {filteredNotes.map((note) => (
                      <Card 
                        key={note.id} 
                        className={cn(
                          "border overflow-hidden transition-all",
                          note.completed && "bg-muted/50 border-muted"
                        )}
                      >
                        <div className="flex items-start p-4 gap-3">
                          <Checkbox 
                            checked={note.completed}
                            onCheckedChange={() => handleToggleNote(note.id)}
                            className={cn(
                              "mt-1",
                              "data-[state=checked]:bg-green-500 data-[state=checked]:text-white data-[state=checked]:border-green-500"
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                {category === "docs" && (
                                  <FileText className="h-4 w-4 text-muted-foreground" />
                                )}
                                <h3 className={cn(
                                  "font-medium break-words",
                                  note.completed && "line-through text-muted-foreground"
                                )}>
                                  {note.title}
                                </h3>
                              </div>
                              <div className="flex items-center gap-2">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Select 
                                        value={note.priority || "medium"} 
                                        onValueChange={(value) => handleUpdatePriority(note.id, value as Priority)}
                                      >
                                        <SelectTrigger className={cn(
                                          "h-8 w-auto border-0 text-xs font-medium",
                                          getPriorityColor(note.priority)
                                        )}>
                                          <SelectValue>
                                            <div className="flex items-center">
                                              {getPriorityIcon(note.priority)}
                                              <span className="ml-1">{note.priority || "No priority"}</span>
                                            </div>
                                          </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="high" className="text-rose-500 font-medium">
                                            <div className="flex items-center">
                                              <AlertTriangle className="h-4 w-4 mr-2" />
                                              High Priority
                                            </div>
                                          </SelectItem>
                                          <SelectItem value="medium" className="text-amber-500 font-medium">
                                            <div className="flex items-center">
                                              <AlertCircle className="h-4 w-4 mr-2" />
                                              Medium Priority
                                            </div>
                                          </SelectItem>
                                          <SelectItem value="low" className="text-green-500 font-medium">
                                            <div className="flex items-center">
                                              <ThumbsUp className="h-4 w-4 mr-2" />
                                              Low Priority
                                            </div>
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Change priority
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>

                                <Popover>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <PopoverTrigger asChild>
                                          <Button 
                                            variant="ghost" 
                                            size="icon"
                                            className={cn(
                                              "h-7 w-7",
                                              note.due_date && new Date(note.due_date) < new Date() ? "text-rose-500" : "",
                                              note.due_date ? "text-primary" : "text-muted-foreground"
                                            )}
                                          >
                                            <CalendarDays className="h-3.5 w-3.5" />
                                          </Button>
                                        </PopoverTrigger>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        {note.due_date ? "Change due date" : "Add due date"}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  <PopoverContent className="w-auto p-0" align="end">
                                    <div className="p-3 border-b">
                                      <div className="flex justify-between items-center">
                                        <span className="font-medium">Set due date</span>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleUpdateDueDate(note.id, null)}
                                        >
                                          Clear
                                        </Button>
                                      </div>
                                      <div className="flex mt-2 gap-2">
                                        <Button size="sm" variant="outline" onClick={() => handleUpdateDueDate(note.id, new Date())}>
                                          Today
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => handleUpdateDueDate(note.id, addDays(new Date(), 1))}>
                                          Tomorrow
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => handleUpdateDueDate(note.id, addDays(new Date(), 7))}>
                                          Next week
                                        </Button>
                                      </div>
                                    </div>
                                    <CalendarComponent
                                      mode="single"
                                      selected={note.due_date && !isNaN(new Date(note.due_date).getTime())
                                        ? new Date(note.due_date) 
                                        : undefined}
                                      onSelect={(date) => handleUpdateDueDate(note.id, date)}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>

                                {category === "docs" && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button 
                                          variant="ghost" 
                                          size="icon"
                                          className="h-7 w-7"
                                          onClick={() => {
                                            navigator.clipboard.writeText(note.content);
                                            toast.success("Document content copied to clipboard");
                                          }}
                                        >
                                          <Copy className="h-3.5 w-3.5" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        Copy content
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}

                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleDeleteNote(note.id)}
                                  className="h-7 w-7 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {renderContent(note, isNoteExpanded(note.id))}
                              
                              {note.content && note.content.length > 200 && (
                                <Button
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-xs p-0 h-6 text-muted-foreground hover:text-foreground"
                                  onClick={() => toggleNoteExpand(note.id)}
                                >
                                  {isNoteExpanded(note.id) ? (
                                    <div className="flex items-center">
                                      <ChevronUp className="h-3 w-3 mr-1" />
                                      <span>Show less</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center">
                                      <ChevronDown className="h-3 w-3 mr-1" />
                                      <span>Show more</span>
                                    </div>
                                  )}
                                </Button>
                              )}
                            </div>
                            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                              <span>Created: {safeFormatDate(note.created_at)}</span>
                              {note.due_date && (
                                <span className={cn(
                                  "font-medium",
                                  new Date(note.due_date) < new Date() ? "text-rose-500" : ""
                                )}>
                                  Due: {safeFormatDate(note.due_date, "No date set")}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Markdown help card */}
        {addItemType === 'doc' && (
          <div className="mt-4 p-4 bg-muted/30 rounded-md border text-sm">
            <div className="flex items-center mb-3">
              <h4 className="font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Markdown Support
              </h4>
            </div>
            <p className="text-muted-foreground mb-3">
              Documents support Markdown formatting for rich text. Some examples:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <code className="bg-muted p-1 rounded">**Bold text**</code>
                <span className="mx-2">→</span>
                <span className="font-bold">Bold text</span>
              </div>
              <div>
                <code className="bg-muted p-1 rounded">*Italic text*</code>
                <span className="mx-2">→</span>
                <span className="italic">Italic text</span>
              </div>
              <div>
                <code className="bg-muted p-1 rounded"># Heading 1</code>
                <span className="mx-2">→</span>
                <span className="font-bold text-lg">Heading 1</span>
              </div>
              <div>
                <code className="bg-muted p-1 rounded">[Link](url)</code>
                <span className="mx-2">→</span>
                <span className="text-primary underline">Link</span>
              </div>
            </div>
          </div>
        )}
      </main>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Note</DialogTitle>
            <DialogDescription>
              Would you also like to delete this note?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => {
                if (noteToToggle) {
                  updateNoteCompletionStatus(noteToToggle, true);
                }
                setDeleteDialogOpen(false);
                setNoteToToggle(null);
              }}
            >
              No, Just Complete
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (noteToToggle) {
                  handleDeleteNote(noteToToggle);
                }
                setDeleteDialogOpen(false);
                setNoteToToggle(null);
              }}
            >
              Yes, Delete Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={deleteConfirmDialogOpen} onOpenChange={setDeleteConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {activeTab === "docs" ? "Document" : "Note"}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {activeTab === "docs" ? "document" : "note"}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmDialogOpen(false);
                setNoteToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteNote}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotesPage; 