import Link from "next/link"
import { icons } from "lucide-react"
import { ToolFeature } from "@/features/tools/tools.types"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ToolCardProps {
    tool: ToolFeature
}

export function ToolCard({ tool }: ToolCardProps) {
    // Convert kebab-case or lowercase to PascalCase for lucide-react keys
    // e.g., "file-text" -> "FileText", "calculator" -> "Calculator"
    const iconName = tool.icon
        .split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('') as keyof typeof icons;

    const LucideIcon = icons[iconName];

    return (
        <Card className="flex flex-col h-full hover:border-primary/50 transition-colors shadow-sm hover:shadow-md">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/5 rounded-md border text-primary">
                        {LucideIcon ? <LucideIcon className="w-5 h-5" /> : <div className="w-5 h-5" />}
                    </div>
                    <CardTitle className="text-xl">{tool.name}</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="flex-1">
                <CardDescription className="text-base">{tool.description}</CardDescription>
            </CardContent>
            <CardFooter>
                <Link href={tool.route} className={cn(buttonVariants({ variant: "secondary" }), "w-full")}>
                    Open Tool
                </Link>
            </CardFooter>
        </Card>
    )
}
