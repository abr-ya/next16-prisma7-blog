"use client";

import { Link2 } from "lucide-react";
import React from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useToolbar } from "@/components/toolbars/toolbar-provider";

const LinkToolbar = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, onClick, children, ...props }, ref) => {
    const { editor } = useToolbar();

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8", editor?.isActive("link") && "bg-accent", className)}
            onClick={(e) => {
              const previousUrl = editor?.getAttributes("link")?.href ?? "";
              const url = window.prompt("Enter URL", previousUrl);

              if (url === null) return;
              if (!editor) return;

              if (url.trim() === "") {
                editor.chain().focus().unsetLink().run();
              } else {
                editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
              }

              onClick?.(e);
            }}
            disabled={!editor}
            ref={ref}
            {...props}
          >
            {children || <Link2 className="h-4 w-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <span>Link</span>
        </TooltipContent>
      </Tooltip>
    );
  },
);

LinkToolbar.displayName = "LinkToolbar";

export { LinkToolbar };
