/**
 * jsPDF AutoTable Type Extensions
 * Author: Maurice Rondeau
 *
 * Extends jsPDF to include the lastAutoTable property
 * added by the jspdf-autotable plugin.
 */

import 'jspdf'

declare module 'jspdf' {
  interface jsPDF {
    /**
     * Contains metadata about the last rendered table.
     * Available after calling autoTable().
     * Optional because it doesn't exist until a table has been rendered.
     */
    lastAutoTable?: {
      /** The Y position where the last table ended */
      finalY: number
      /** The page number where the last table ended */
      pageNumber?: number
      /** The settings used for the last table */
      settings?: Record<string, unknown>
    }
  }
}
