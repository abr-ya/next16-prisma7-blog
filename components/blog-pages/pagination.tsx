interface IPaginationProps {
  currentPage: number;
  totalPages: number;
  page: number;
}

export const Pagination = ({ currentPage, totalPages, page }: IPaginationProps) => {
  console.log("Pagination", `${currentPage}/${totalPages}/${page}`);

  return <div>pagination</div>;
};
