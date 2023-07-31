export interface Hint {
  _id: string
  type: string
  parent: string
  colour: string
  link: string
  order: number
}

export interface HintMap {
  [key: string]: Partial<Hint>
}

export interface Identified {
  _id: string
}

export interface TopicTarget extends Identified {
  name: string
  kind: string
  from: number
  to: number
}

export interface Interval extends TopicTarget {
  parent: string
  children: string[]
}

export interface Subject extends TopicTarget {
  category: string
  link: string
  icon: string
  tags: string[]
}

export enum TopicType {
  subject = 'Subject',
  interval = 'Interval'
}

/**
 * Server-side topic object
 */
export interface Topic extends Identified {
  topic: TopicType
  topicTarget: string
  linkId: string
  description: string
}

/**
 * Client-side topic request object for finding a topic based on its target
 */
export interface TopicRequest {
  type: TopicType // type of the topic to request
  topicTarget: TopicTarget // the actual topic object to find
}

export interface Results {
  intervals: Interval[]
  subjects: Subject[]
  topics: Topic[]
}

export interface FilteredCategory {
  name: string
  filtered: boolean
}

export interface Legend {
  visible: boolean
  activeTab: string
}
