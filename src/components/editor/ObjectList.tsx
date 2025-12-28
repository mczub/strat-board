/**
 * ObjectList - Left panel with 5 tabs containing all addable objects
 * 
 * Clicking an object icon adds it to the canvas center.
 */

import { useState } from 'react'
import { useEditorStore } from '@/stores/useEditorStore'
import { OBJECT_CATEGORIES, getObjectsByCategory, type ObjectDefinition } from '@/lib/editorObjects'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ObjectListProps {
    className?: string
}

function ObjectIcon({ obj }: { obj: ObjectDefinition }) {
    const { addObject } = useEditorStore()
    const iconSrc = `/icons/${obj.type}.png`

    const handleClick = () => {
        addObject(obj.type)
    }

    return (
        <button
            onClick={handleClick}
            className="flex flex-col items-center justify-center p-1.5 rounded hover:bg-muted/50 transition-colors group"
            title={obj.label}
        >
            <div className="w-8 h-8 flex items-center justify-center">
                <img
                    src={iconSrc}
                    alt={obj.label}
                    className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform"
                    onError={(e) => {
                        // Fallback for missing icons
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                    }}
                />
            </div>
            <span className="text-[10px] text-muted-foreground truncate w-full text-center mt-0.5">
                {obj.label}
            </span>
        </button>
    )
}

export function ObjectList({ className = '' }: ObjectListProps) {
    const [activeTab, setActiveTab] = useState('class_job')

    return (
        <Card className={`bg-card/50 border-border ${className}`}>
            <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-sm font-medium">Object List</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-2">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid grid-cols-5 w-full h-8 mb-2">
                        {OBJECT_CATEGORIES.map((cat) => (
                            <TabsTrigger
                                key={cat.id}
                                value={cat.id}
                                className="text-xs px-1 py-1"
                                title={cat.label}
                            >
                                <img
                                    src={`/icons/${cat.icon}.png`}
                                    alt={cat.label}
                                    className="w-5 h-5 object-contain"
                                />
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {OBJECT_CATEGORIES.map((cat) => (
                        <TabsContent
                            key={cat.id}
                            value={cat.id}
                            className="mt-0 max-h-[calc(100vh-20rem)] overflow-y-auto"
                        >
                            <div className="grid grid-cols-5 gap-0.5">
                                {getObjectsByCategory(cat.id).map((obj) => (
                                    <ObjectIcon key={obj.type} obj={obj} />
                                ))}
                            </div>
                        </TabsContent>
                    ))}
                </Tabs>
            </CardContent>
        </Card>
    )
}
