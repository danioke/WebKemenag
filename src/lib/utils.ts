import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function createSlug(text: string) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export function formatIndonesianDate(dateString: string | Date | undefined | null): string {
  if (!dateString) return '';
  
  let date: Date;
  if (dateString instanceof Date) {
    date = dateString;
  } else {
    const cleanStr = String(dateString).trim();
    if (!cleanStr) return '';
    
    const indoMonths = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const indoMonthsShort = [
      "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", 
      "Jul", "Agt", "Sep", "Okt", "Nov", "Des"
    ];
    
    // Check if it's already in the format "d MonthName yyyy"
    const parts = cleanStr.split(/\s+/);
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const monthStr = parts[1];
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(year) && year > 1900 && year < 2100) {
        if (indoMonths.includes(monthStr)) {
          return cleanStr;
        }
        
        const shortIdx = indoMonthsShort.findIndex(m => monthStr.toLowerCase().startsWith(m.toLowerCase()));
        if (shortIdx !== -1) {
          return `${day} ${indoMonths[shortIdx]} ${year}`;
        }
        
        const engMonthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const engIdx = engMonthsShort.findIndex(m => monthStr.toLowerCase().startsWith(m.toLowerCase()));
        if (engIdx !== -1) {
          return `${day} ${indoMonths[engIdx]} ${year}`;
        }
        
        const engMonthsLong = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const engLongIdx = engMonthsLong.findIndex(m => monthStr.toLowerCase() === m.toLowerCase());
        if (engLongIdx !== -1) {
          return `${day} ${indoMonths[engLongIdx]} ${year}`;
        }
      }
    }
    
    date = new Date(cleanStr);
  }
  
  if (isNaN(date.getTime())) {
    return String(dateString);
  }
  
  const day = date.getDate();
  const monthIndex = date.getMonth();
  const year = date.getFullYear();
  
  const indoMonths = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  
  return `${day} ${indoMonths[monthIndex]} ${year}`;
}

export function formatAgendaFullDate(agenda: { date: string; month: string; fullDate?: string }): string {
  if (agenda.fullDate) {
    return formatIndonesianDate(agenda.fullDate);
  }
  
  const monthMap: Record<string, string> = {
    'Jan': 'Januari', 'Feb': 'Februari', 'Mar': 'Maret', 'Apr': 'April',
    'Mei': 'Mei', 'Jun': 'Juni', 'Jul': 'Juli', 'Agt': 'Agustus', 'Agt.': 'Agustus',
    'Okt': 'Oktober', 'Nov': 'November', 'Des': 'Desember', 'Sep': 'September',
    'Oct': 'Oktober', 'Dec': 'Desember'
  };
  const fullMonth = monthMap[agenda.month] || agenda.month;
  const year = agenda.month === 'Okt' ? '2024' : new Date().getFullYear().toString();
  return `${agenda.date} ${fullMonth} ${year}`;
}

