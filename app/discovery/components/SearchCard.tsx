import { CiSearch } from 'react-icons/ci';

interface SearchCardProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  placeholder?: string;
}

export default function SearchCard({
  searchTerm,
  onSearchChange,
  placeholder = "Search applications..."
}: SearchCardProps) {
  return (
    <div className="card bg-base-100 shadow-md">
      <div className="card-body">
        <div className="relative">
          <input
            type="text"
            placeholder={placeholder}
            className="input input-bordered w-full pr-10"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <CiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-base-content/50" />
        </div>
      </div>
    </div>
  );
}