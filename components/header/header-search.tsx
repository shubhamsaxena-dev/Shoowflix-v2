import SearchBar from "@/components/search-bar";

interface HeaderSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export default function HeaderSearch({
  onSearch,
  placeholder = "Search by title",
}: HeaderSearchProps) {
  return (
    <div className="flex-1 max-w-md mx-4">
      <SearchBar onSearch={onSearch} placeholder={placeholder} />
    </div>
  );
}
