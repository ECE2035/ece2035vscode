import { useState } from "react";
import { BYTES_PER_ROW } from "../App";

const PAGINATED_SIZE = 128;

export default function MemoryView({ title, baseAddress, memoryData, oldMemory, reverse, count }) {


  const [page, setPage] = useState(0);

  if (!memoryData) {
    return <></>
  }

  const rows = Math.ceil(memoryData.length / BYTES_PER_ROW);

  if (!count) {
    count = rows;
  }

  const numPages = count !== -1 ? Math.ceil(count / PAGINATED_SIZE) : Math.ceil(count / PAGINATED_SIZE);

  const paginatedBase = PAGINATED_SIZE * page;
  const paginatedEnd = count === -1 ? Math.min(PAGINATED_SIZE * page + PAGINATED_SIZE, count) : count;
  
  const paginatedLength = paginatedEnd - paginatedBase;

  console.log({count});

  let rowData =
    [...Array(paginatedLength)].map((_, row) => {
      return (
        <div className='row'>
          <span className='address'>{(baseAddress + paginatedBase + row * BYTES_PER_ROW).toString().padStart(6, "0")}</span>
          <div className='hex-values'>
            {[...Array(BYTES_PER_ROW)].map((_, col) => {
              const idx = paginatedBase + row * BYTES_PER_ROW + col;
              if (idx < memoryData.length) {
                const value = memoryData[idx];

                return (
                  <span className={`hex-value`}>{value.toString(16).padStart(2, "0")}</span>
                )
              }
              return <></>
            })}
          </div>
        </div>);
    });

  const handleNextPage = () => {
    if (page === numPages - 1) {
      return;
    }

    setPage(page + 1);
  }

  const handlePrevPage = () => {
    if (page === 0) {
      return;
    }

    setPage(page - 1);
  }

  return <div>
    <h5>{title}</h5>

    <div class="hex-viewer">
      <div className="hex-toolbar">

          <a href="/" onClick={handlePrevPage} className={`hex-toolbar-prev ${page === 0 ? "arrow-disabled" : ""}`}>
            <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M7 3.093l-5 5V8.8l5 5 .707-.707-4.146-4.147H14v-1H3.56L7.708 3.8 7 3.093z"/></svg>
          </a>
          <div className={`hex-toolbar-addr`}>Page {page + 1}/{numPages}</div>
          <a href="/" onClick={handleNextPage} className={`hex-toolbar-next ${((page + 1) === numPages) ? "arrow-disabled" : ""}`}>
            <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M9 13.887l5-5V8.18l-5-5-.707.707 4.146 4.147H2v1h10.44L8.292 13.18l.707.707z"/></svg>
          </a>
        </div>
      {rowData}
    </div>

  </div>
}