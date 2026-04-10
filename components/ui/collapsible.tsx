/**
 * Collapsible Component
 * Author: Maurice Rondeau
 *
 * A collapsible component using Radix UI Collapsible primitive.
 * Used for expandable/collapsible sections in filter panels.
 */

'use client'

import * as CollapsiblePrimitive from '@radix-ui/react-collapsible'

const Collapsible = CollapsiblePrimitive.Root

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger

const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
