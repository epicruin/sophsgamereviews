export interface ArticleFormData {
  title: string;
  summary: string;
  content: string;
  tldr: string;
  image: string;
  scheduled_for: string | null;
}

export interface ArticleFormProps {
  articleData?: any;
}

export const initialFormData: ArticleFormData = {
  title: "",
  summary: "",
  content: "",
  tldr: "",
  image: "",
  scheduled_for: null
}; 