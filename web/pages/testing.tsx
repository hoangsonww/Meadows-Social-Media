/**
 * This page is reserved for your development and testing purposes.
 *
 * @author Ajay Gandecha <agandecha@unc.edu>
 * @license MIT
 * @see https://comp426-25s.github.io/
 */

import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import { useEffect } from "react";

export default function Testing() {
  // Configuration
  const supabase = createSupabaseComponentClient();

  // PLACE FUNCTIONS YOU WANT TO TEST HERE.
  // Make sure that their results are returned.
  const functionToTest = async () => {
    // Replace what is after `await` with your function.
    return await (() => {})();
  };

  // This useEffect will run the function and log
  // the result to the console. You should not need
  // to modify this.
  useEffect(() => {
    functionToTest().then((result) => {
      console.log(result);
    });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <h1 className="text-xl font-bold">Testing Page</h1>
      <p>Check out the browser dev tools and console to test out functions.</p>
    </div>
  );
}
