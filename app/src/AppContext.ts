import { createContext, useState, useEffect } from "react";
import {
  FilteredCategory
} from '@evotempus/types';

type AppContext = {
  subjectCategories: FilteredCategory[]
}

export const AppContext = createContext<AppContext | undefined>(undefined);

// TODO

/*
 * Need to add an effect in here that fetches the HintService as an effect see https://www.carlrippon.com/react-context-with-typescript-p1/
 * Then create an AppContextProvider etc and add this to App
 * Remove the AppContext stuff from app and add to Search instead as this is conumering stuff
 */
