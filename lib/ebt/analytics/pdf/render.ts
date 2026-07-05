import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { createElement, type ReactElement } from 'react'
import { StandardsSummaryDoc, type PilotPdfInput } from './standards-summary'
import { FleetSummaryDoc, type FleetPdfInput } from './fleet-summary'

/** Render the per-pilot Standards Summary to PDF bytes (server-side, no browser). */
export async function renderPilotStandardsPdf(d: PilotPdfInput): Promise<Buffer> {
  // StandardsSummaryDoc renders a <Document> root; cast to the shape renderToBuffer expects.
  return renderToBuffer(createElement(StandardsSummaryDoc, { d }) as ReactElement<DocumentProps>)
}

/** Render the Fleet Analytics Summary to PDF bytes (server-side, no browser). */
export async function renderFleetAnalyticsPdf(d: FleetPdfInput): Promise<Buffer> {
  return renderToBuffer(createElement(FleetSummaryDoc, { d }) as ReactElement<DocumentProps>)
}
