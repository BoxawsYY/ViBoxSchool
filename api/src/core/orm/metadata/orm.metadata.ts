export interface ColumnConfig {
    name?: string
    type?: 'string' | 'number' | 'boolean' | 'date' | 'uuid' | 'text'
    nullable?: boolean
    default?: any
    unique?: boolean
    jsType?: any
}

export interface JoinTableConfig {
    name?: string
    joinColumn?: string
    inverseJoinColumn?: string
}

export interface RelationConfig {
    type: 'OneToMany' | 'ManyToOne' | 'OneToOne' | 'ManyToMany'
    target: () => Function
    joinTable?: string | JoinTableConfig
    joinColumn?: string
    inverse?: string
    owner?: boolean
    eager?: boolean
}

export interface EntityConfig {
    tableName: string
}
