import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchBar({
  onSearch,
  placeholder = "Search by title",
  className = "",
}: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // Debounced search - search after user stops typing for 500ms
    const timer = setTimeout(() => {
      onSearch(value);
    }, 500);

    return () => clearTimeout(timer);
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
        className="bg-input border-border pl-10 w-full focus:ring-2 focus:ring-ring"
        data-testid="search-input"
      />
      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
    </form>
  );
}
