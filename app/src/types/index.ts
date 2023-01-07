export interface Hint {
  _id: string,
  type: string,
  parent: string,
  colour: string,
  link: string,
  order: number
};

export interface HintMap {
  [key: string]: Partial<Hint>
}

export interface TopicTarget {
  _id: string,
  name: string,
  kind: string,
  from: number,
  to:   number,
}

export interface Interval extends TopicTarget {
  parent: string,
  children: string[],
}

export interface Subject extends TopicTarget {
  category: string,
  link: string,
  icon: string,
  tags: string[],
}

export interface FilteredCategory {
  name: string,
  filtered: boolean,
}

export interface Legend {
  visible: boolean,
  activeTab: string
}
