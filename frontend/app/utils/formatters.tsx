
export const formatDate = (date: Date, displayYear: boolean = true) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
  
    if(!displayYear) {
      const currentYear = new Date().getFullYear();
      if(year === currentYear) {
        return `${day}.${month} ${hours}:${minutes}`;
      }
    }
    return `${day}.${month}.${year} ${hours}:${minutes}`;
};

export const formatDateStr = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, "0") // Ensure two digits
    const month = (date.getMonth() + 1).toString().padStart(2, "0") // Months are 0-based
    const year = date.getFullYear()
    
    return `${day}.${month}.${year}`
  }


export const formatDateWithUserOffset = (dateString: string, userPreferredOffset: number, displayYear: boolean = true) => {
    if (!dateString) return "N/A"

    const date = new Date(dateString)
    const offsetDate = new Date(date.getTime() + userPreferredOffset * 60 * 60 * 1000)

    return formatDate(offsetDate, displayYear)
  }