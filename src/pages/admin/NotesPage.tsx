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
  DocumentCategory,
  VALID_DOC_CATEGORIES,
  safeCategory,
  safePriority,
  safeDocCategory
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
  const [newDocCategory, setNewDocCategory] = useState<DocumentCategory>("instructional");
  const [newDocPinned, setNewDocPinned] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"created" | "due" | "priority" | "category">("created");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategory | "all">("all");
  const [userId, setUserId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToToggle, setNoteToToggle] = useState<string | null>(null);
  const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<string[]>([]);
  const [addItemType, setAddItemType] = useState<"note" | "doc">("note");
  const [showPreview, setShowPreview] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Note | null>(null);
  const [viewDocDialogOpen, setViewDocDialogOpen] = useState(false);
  const [viewDocPreview, setViewDocPreview] = useState(true);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [viewNoteDialogOpen, setViewNoteDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [totalItems, setTotalItems] = useState(0);

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
      
      // Get count for pagination
      const countResult = await supabase
        .from('notes')
        .select('id', { count: 'exact' })
        .eq('category', activeTab)
        .eq('user_id', userId);
        
      if (countResult.count !== null) {
        setTotalItems(countResult.count);
      }
      
      // Calculate pagination offset
      const offset = (currentPage - 1) * itemsPerPage;
      
      // Query database for notes with the current category and pagination
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('category', activeTab)
        .eq('user_id', userId) // Filter by the current user's ID
        .order('created_at', { ascending: false })
        .range(offset, offset + itemsPerPage - 1);
      
      if (error) {
        throw error;
      }
      
      // Convert database types to application types with safe conversions
      const typedNotes = (data || []).map((note: NoteDatabaseRow): Note => ({
        ...note,
        category: safeCategory(note.category),
        priority: safePriority(note.priority),
        doc_category: note.doc_category ? safeDocCategory(note.doc_category) : undefined,
        pinned: note.pinned || false
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

  // Effect to refetch notes when pagination changes
  useEffect(() => {
    if (userId) {
      fetchNotes();
    }
  }, [userId, activeTab, currentPage]);

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
      
      // Build note data based on type
      const noteData: any = {
        title: newNoteTitle.trim(),
        content: newNoteContent || "",
        category: category,
        completed: false,
        user_id: userId
      };
      
      // Add relevant fields based on note type
      if (category === "docs") {
        noteData.doc_category = newDocCategory;
        noteData.pinned = newDocPinned;
        // For documents we don't use priority or due date
        noteData.priority = null;
        noteData.due_date = null;
      } else {
        noteData.priority = newNotePriority || "medium";
        noteData.due_date = newNoteDueDate?.toISOString() || null;
        // Documents-only fields
        noteData.doc_category = null;
        noteData.pinned = false;
      }
      
      const { data, error } = await supabase
        .from('notes')
        .insert(noteData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error("No data returned from insert operation");
      }

      // Convert database response to application type with safe conversions
      const typedData = data as unknown as NoteDatabaseRow;
      const typedNote: Note = {
        ...typedData,
        category: safeCategory(typedData.category),
        priority: safePriority(typedData.priority),
        doc_category: typedData.doc_category ? safeDocCategory(typedData.doc_category) : undefined,
        pinned: Boolean(typedData.pinned)
      };

      // Only add to notes array if the new note is in the currently active tab
      if (typedNote.category === activeTab) {
        setNotes([typedNote, ...notes]);
      }
      
      // Reset form for documents
      if (category === "docs") {
        setNewNoteTitle("");
        setNewNoteContent("");
        setNewDocCategory("instructional");
        setNewDocPinned(false);
        setShowPreview(false);
        
        // Switch to the docs tab to show the new document
        setActiveTab("docs");
      }
      
      toast.success(`${category === "docs" ? "Document" : "Note"} added successfully`);
    } catch (error: any) {
      console.error('Error adding note:', error);
      // More specific error messages based on error type
      if (error.code === "23505") {
        toast.error('This note appears to be a duplicate');
      } else if (error.code?.startsWith("23")) {
        toast.error('Invalid data format');
      } else {
        toast.error(`Failed to add ${category === "docs" ? "document" : "note"}. Please try again.`);
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

  // Toggle pinned status for a document
  const handleTogglePin = async (id: string) => {
    if (!id) {
      toast.error("Invalid document ID");
      return;
    }
    
    try {
      const docToUpdate = notes.find(note => note.id === id);
      
      if (!docToUpdate) {
        toast.error("Document not found");
        return;
      }
      
      const newPinStatus = !docToUpdate.pinned;
      
      const { error } = await supabase
        .from('notes')
        .update({ pinned: newPinStatus } as any)
        .eq('id', id);

      if (error) {
        throw error;
      }

      setNotes(notes.map(note => 
        note.id === id ? { ...note, pinned: newPinStatus } : note
      ));
      
      toast.success(newPinStatus ? "Document pinned" : "Document unpinned");
    } catch (error) {
      console.error('Error updating pin status:', error);
      toast.error('Failed to update pin status');
      fetchNotes();
    }
  };

  // Filter and sort notes based on active tab, search query, and filters
  const filteredNotes = notes
    .filter(note => 
      searchQuery === "" || 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter(note => {
      if (activeTab === "docs") {
        return categoryFilter === "all" || note.doc_category === categoryFilter;
      } else {
        return priorityFilter === "all" || note.priority === priorityFilter;
      }
    })
    .sort((a, b) => {
      // First handle pinned documents
      if (activeTab === "docs") {
        // Pinned docs come first
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        
        if (sortBy === "category") {
          // Sort by category name
          return (a.doc_category || "other").localeCompare(b.doc_category || "other");
        }
      }
      
      // Regular sorting logic
      if (sortBy === "created") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === "due") {
        // Handle null due dates - place them at the end
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      } else if (sortBy === "priority") {
        // Priority sorting (high > medium > low > null)
        const priorityValue = { high: 3, medium: 2, low: 1, null: 0 };
        const aValue = a.priority ? priorityValue[a.priority] : 0;
        const bValue = b.priority ? priorityValue[b.priority] : 0;
        return bValue - aValue;
      }
      
      // Default to created date
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
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

  // Handle opening a note to view
  const handleViewNote = (note: Note) => {
    setSelectedNote(note);
    setViewNoteDialogOpen(true);
  };

  // Handle opening a doc to view
  const handleViewDoc = (note: Note) => {
    setSelectedDoc(note);
    setViewDocDialogOpen(true);
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

  // Render the docs tab differently
  const renderDocsTab = () => {
    if (isLoading) {
      return (
        <div className="p-8 flex items-center justify-center">
          <p>Loading documents...</p>
        </div>
      );
    }
    
    if (filteredNotes.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <FileText className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No documents found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {categoryFilter !== "all" 
                ? `Try changing your category filter or create a new ${categoryFilter.replace(/_/g, ' ')} document`
                : "Add your first document above"}
            </p>
          </CardContent>
        </Card>
      );
    }
    
    return (
      <div className="space-y-4">
        <ScrollArea className="overflow-y-auto max-h-[600px]">
          <div className="space-y-2 p-1">
            {filteredNotes.map((doc) => (
              <Card 
                key={doc.id} 
                className={cn(
                  "border transition-all hover:bg-accent/50 cursor-pointer",
                  doc.pinned && "border-primary border-2",
                  doc.completed && "bg-muted/50"
                )}
                onClick={() => handleViewDoc(doc)}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      {doc.pinned ? (
                        <Bookmark className="h-5 w-5 text-primary fill-primary" />
                      ) : (
                        <FileText className="h-5 w-5 text-primary" />
                      )}
                      <h3 className={cn(
                        "font-medium break-words",
                        doc.completed && "text-muted-foreground"
                      )}>
                        {doc.title}
                      </h3>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {doc.doc_category && (
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize"
                        )}>
                          {doc.doc_category.replace(/_/g, ' ')}
                        </span>
                      )}
                      
                      <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTogglePin(doc.id);
                                }}
                              >
                                {doc.pinned ? (
                                  <Bookmark className="h-3.5 w-3.5 text-primary fill-primary" />
                                ) : (
                                  <Bookmark className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {doc.pinned ? "Unpin document" : "Pin document"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteNote(doc.id);
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Delete document
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-muted-foreground">
                      Created: {safeFormatDate(doc.created_at)}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
        
        {totalItems > itemsPerPage && (
          <div className="flex justify-center items-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {Math.ceil(totalItems / itemsPerPage)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={currentPage >= Math.ceil(totalItems / itemsPerPage)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
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
                  {addItemType === 'note' ? (
                    <>
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
                    </>
                  ) : (
                    <>
                      <Select 
                        value={newDocCategory} 
                        onValueChange={(value) => setNewDocCategory(value as DocumentCategory)}
                      >
                        <SelectTrigger className="w-full sm:w-[180px]">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {VALID_DOC_CATEGORIES.map((category) => (
                            <SelectItem key={category} value={category} className="capitalize">
                              {category.replace(/_/g, ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button 
                        variant={newDocPinned ? "default" : "outline"}
                        className="w-full sm:w-[180px] flex items-center gap-2"
                        onClick={() => setNewDocPinned(!newDocPinned)}
                      >
                        {newDocPinned ? (
                          <>
                            <Bookmark className="h-4 w-4 fill-current" />
                            Pinned Document
                          </>
                        ) : (
                          <>
                            <Bookmark className="h-4 w-4" />
                            Pin Document
                          </>
                        )}
                      </Button>
                    </>
                  )}
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
                <div className="space-y-1">
                  <Textarea
                    placeholder={addItemType === 'note' ? "Quick note content" : "Document content - supports Markdown formatting"}
                    value={newNoteContent}
                    onChange={(e) => {
                      if (addItemType === 'note' && e.target.value.length > 300) {
                        // Limit to 300 chars only for notes
                        setNewNoteContent(e.target.value.slice(0, 300));
                      } else {
                        setNewNoteContent(e.target.value);
                      }
                    }}
                    rows={addItemType === 'note' ? 3 : 8}
                    maxLength={addItemType === 'note' ? 300 : undefined}
                    className={addItemType === 'doc' ? "font-mono text-sm" : ""}
                  />
                  {addItemType === 'note' && (
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>{newNoteContent.length}/300 characters</span>
                      {newNoteContent.length >= 280 && (
                        <span className="text-primary">For longer notes, add it as a document</span>
                      )}
                    </div>
                  )}
                </div>
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
                    if (addItemType === 'note') {
                      setNewNoteDueDate(null);
                      setNewNotePriority("medium");
                    } else {
                      setNewDocCategory("instructional");
                      setNewDocPinned(false);
                    }
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
                  
                  {activeTab === "docs" ? (
                    <Button 
                      variant={sortBy === "category" ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setSortBy("category")}
                      className="min-w-20"
                    >
                      <FileText className="h-4 w-4 mr-1" /> 
                      Category
                    </Button>
                  ) : (
                    <>
                      <Button 
                        variant={sortBy === "due" ? "default" : "outline"} 
                        size="sm"
                        onClick={() => setSortBy("due")}
                        className="min-w-20"
                      >
                        <Calendar className="h-4 w-4 mr-1" /> 
                        Due Date
                      </Button>
                      <Button 
                        variant={sortBy === "priority" ? "default" : "outline"} 
                        size="sm"
                        onClick={() => setSortBy("priority")}
                        className="min-w-20"
                      >
                        <AlertTriangle className="h-4 w-4 mr-1" /> 
                        Priority
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-3">
              <div className="flex flex-col items-center gap-2">
                {activeTab === "docs" ? (
                  <>
                    <span className="text-sm text-muted-foreground font-medium text-center">Filter category:</span>
                    <div className="flex items-center justify-center gap-2">
                      <Button 
                        variant={categoryFilter === "all" ? "default" : "outline"} 
                        size="sm"
                        onClick={() => setCategoryFilter("all")}
                        className="min-w-16"
                      >
                        <FilterX className="h-4 w-4 mr-1" />
                        All
                      </Button>
                      <Select
                        value={categoryFilter === "all" ? "all" : categoryFilter}
                        onValueChange={(value) => setCategoryFilter(value === "all" ? "all" : value as DocumentCategory)}
                      >
                        <SelectTrigger className="h-9 min-w-[150px]">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {VALID_DOC_CATEGORIES.map((category) => (
                            <SelectItem key={category} value={category} className="capitalize">
                              {category.replace(/_/g, ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : (
                  <>
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
                  </>
                )}
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

          {["reviews", "articles", "general"].map((category) => (
            <TabsContent key={category} value={category} className="mt-0">
              {isLoading ? (
                <div className="p-8 flex items-center justify-center">
                  <p>Loading notes...</p>
                </div>
              ) : filteredNotes.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center p-8">
                    <PenLine className="h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No notes found</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {priorityFilter !== "all" 
                        ? `Try changing your priority filter or create a new ${priorityFilter} priority note`
                        : "Add your first note above"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  <ScrollArea className="overflow-y-auto max-h-[600px]">
                    <div className="space-y-2 p-1">
                      {filteredNotes.map((note) => (
                        <Card 
                          key={note.id} 
                          className={cn(
                            "border transition-all hover:bg-accent/50 cursor-pointer",
                            note.completed && "bg-muted/50"
                          )}
                          onClick={() => handleViewNote(note)}
                        >
                          <div className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 flex-1">
                                <Checkbox 
                                  checked={note.completed}
                                  onCheckedChange={() => handleToggleNote(note.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  className={cn(
                                    "data-[state=checked]:bg-green-500 data-[state=checked]:text-white data-[state=checked]:border-green-500"
                                  )}
                                />
                                <h3 className={cn(
                                  "font-medium break-words",
                                  note.completed && "text-muted-foreground line-through"
                                )}>
                                  {note.title}
                                </h3>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "text-xs px-2 py-0.5 rounded-full flex items-center gap-1",
                                  note.priority === "high" ? "bg-rose-500/10 text-rose-500" : 
                                  note.priority === "medium" ? "bg-amber-500/10 text-amber-500" : 
                                  "bg-green-500/10 text-green-500"
                                )}>
                                  {getPriorityIcon(note.priority)}
                                  <span>{note.priority}</span>
                                </span>
                                
                                <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                                  {note.due_date && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button 
                                            variant="ghost" 
                                            size="icon"
                                            className={cn(
                                              "h-7 w-7",
                                              new Date(note.due_date) < new Date() ? "text-rose-500" : "text-primary"
                                            )}
                                          >
                                            <CalendarDays className="h-3.5 w-3.5" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          Due: {safeFormatDate(note.due_date)}
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                  
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button 
                                          variant="ghost" 
                                          size="icon"
                                          className="h-7 w-7 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteNote(note.id);
                                          }}
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        Delete note
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-xs text-muted-foreground">
                                Created: {safeFormatDate(note.created_at)}
                              </span>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                  
                  {totalItems > itemsPerPage && (
                    <div className="flex justify-center items-center gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {Math.ceil(totalItems / itemsPerPage)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => p + 1)}
                        disabled={currentPage >= Math.ceil(totalItems / itemsPerPage)}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          ))}
          
          {/* Special rendering for docs tab */}
          <TabsContent value="docs" className="mt-0">
            {renderDocsTab()}
          </TabsContent>
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

      {/* Note view dialog */}
      <Dialog open={viewNoteDialogOpen} onOpenChange={setViewNoteDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenLine className="h-5 w-5" />
              {selectedNote?.title}
            </DialogTitle>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  Created: {selectedNote ? safeFormatDate(selectedNote.created_at) : ''}
                </span>
                {selectedNote?.priority && (
                  <span className={cn(
                    "px-2 py-0.5 rounded-full bg-primary/10 capitalize flex items-center gap-1",
                    selectedNote.priority === "high" ? "text-rose-500" : 
                    selectedNote.priority === "medium" ? "text-amber-500" : 
                    "text-green-500"
                  )}>
                    {getPriorityIcon(selectedNote.priority)}
                    <span>{selectedNote.priority}</span>
                  </span>
                )}
              </div>
              <div>
                {selectedNote?.due_date && (
                  <span className={cn(
                    "text-sm font-medium flex items-center gap-1",
                    new Date(selectedNote.due_date) < new Date() ? "text-rose-500" : "text-primary"
                  )}>
                    <CalendarDays className="h-4 w-4" />
                    Due: {safeFormatDate(selectedNote.due_date, "No date set")}
                  </span>
                )}
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 mt-4 overflow-y-auto" style={{ maxHeight: "calc(80vh - 180px)" }}>
            <div className="p-2 whitespace-pre-line">
              {selectedNote?.content}
            </div>
          </div>
          
          <DialogFooter className="mt-4 gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                if (selectedNote) {
                  handleToggleNote(selectedNote.id);
                  setViewNoteDialogOpen(false);
                }
              }}
              className="gap-2"
            >
              <Check className="h-4 w-4" />
              {selectedNote?.completed ? "Mark Incomplete" : "Mark Complete"}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                if (selectedNote) {
                  navigator.clipboard.writeText(selectedNote.content);
                  toast.success("Note content copied");
                }
              }}
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy Content
            </Button>
            <Button onClick={() => setViewNoteDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document view dialog */}
      <Dialog open={viewDocDialogOpen} onOpenChange={setViewDocDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedDoc?.pinned ? (
                <Bookmark className="h-5 w-5 text-primary fill-primary" />
              ) : (
                <FileText className="h-5 w-5" />
              )}
              {selectedDoc?.title}
            </DialogTitle>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  Created: {selectedDoc ? safeFormatDate(selectedDoc.created_at) : ''}
                </span>
                {selectedDoc?.doc_category && (
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">
                    {selectedDoc.doc_category.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex border rounded-md overflow-hidden mr-2">
                  <Button
                    type="button"
                    variant={!viewDocPreview ? "default" : "ghost"}
                    size="sm"
                    className="rounded-none px-3 py-0 h-7"
                    onClick={() => setViewDocPreview(false)}
                  >
                    Raw
                  </Button>
                  <Button
                    type="button"
                    variant={viewDocPreview ? "default" : "ghost"}
                    size="sm"
                    className="rounded-none px-3 py-0 h-7"
                    onClick={() => setViewDocPreview(true)}
                  >
                    Preview
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1"
                  onClick={() => {
                    if (selectedDoc) {
                      handleTogglePin(selectedDoc.id);
                    }
                  }}
                >
                  {selectedDoc?.pinned ? (
                    <>
                      <Bookmark className="h-4 w-4 fill-primary text-primary" />
                      <span>Unpin</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="h-4 w-4" />
                      <span>Pin</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 mt-4 overflow-y-auto" style={{ maxHeight: "calc(80vh - 180px)" }}>
            {viewDocPreview ? (
              <div className="prose prose-sm dark:prose-invert max-w-none p-2">
                {selectedDoc && (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {selectedDoc.content}
                  </ReactMarkdown>
                )}
              </div>
            ) : (
              <div className="font-mono text-sm bg-muted/30 p-4 whitespace-pre-wrap">
                {selectedDoc?.content}
              </div>
            )}
          </div>
          
          <DialogFooter className="mt-4 gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                if (selectedDoc) {
                  navigator.clipboard.writeText(selectedDoc.content);
                  toast.success("Document content copied");
                }
              }}
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy Content
            </Button>
            <Button onClick={() => setViewDocDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotesPage; 