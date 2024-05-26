"use client";

import * as React from "react";
import Link from "next/link";

import { cn } from "@/libs/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

export function LinksDesktop() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Collections</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
              <li className="row-span-3">
                <NavigationMenuLink asChild>
                  <Link
                    className="flex flex-col justify-end w-full h-full p-6 no-underline rounded-md outline-none select-none from-muted/50 to-muted focus:shadow-md bg-center bg-[url('/main-image.webp')]"
                    href="/"
                  >
                    <div className="mt-4 mb-1 text-sm font-medium">
                      VIEW ALL
                    </div>
                    <p className="text-sm leading-tight text-muted-foreground">
                      Discover wardrobe staples for every occasion.
                    </p>
                  </Link>
                </NavigationMenuLink>
              </li>
              <ListItem href="/t-shirts" title="T-SHIRTS">
                Our men&apos;s T-shirts offer timeless style in a range of
                designs, colors, and textures. From classic to contemporary,
                find the perfect tee for any occasion.
              </ListItem>
              <ListItem href="/pants" title="PANTS">
                Explore essential men&apos;s pants for all occasions. From
                classic chinos to modern joggers, find your perfect fit in a
                variety of styles and colors.
              </ListItem>
              <ListItem href="/sweatshirts" title="SWEATSHIRTS">
                Much like the T-shirt, men&apos;s sweatshirts are far more than
                a basic.
              </ListItem>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground hover:bg-[#1F1F1F]",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none text-[]">
            {title}
          </div>
          <p className="text-sm leading-snug line-clamp-2 text-muted-foreground text-[#A1A1A1]">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";
