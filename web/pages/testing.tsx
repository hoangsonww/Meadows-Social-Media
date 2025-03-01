/**
 * This page is reserved for your development and testing purposes.
 *
 * @author  Ajay Gandecha
 * @license MIT
 * @see     https://comp426-25s.github.io/
 */

import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import { useEffect } from "react";

// --- Import everything you want to test ---
import {
  getPost,
  getFeed,
  getFollowingFeed,
  getLikesFeed,
  toggleLike,
} from "@/utils/supabase/queries/post";

import {
  getProfileData,
  getFollowing,
  getProfilePosts,
  toggleFollowing,
} from "@/utils/supabase/queries/profile";

export default function Testing() {
  const supabase = createSupabaseComponentClient();

  // Test values from the database - might not work
  // since I deleted the original test data
  const TEST_POST_ID = "d62ad56a-7067-4946-8461-f46e3342f3c9";
  const TEST_PROFILE_ID = "39dadd11-f0d9-414e-9c5b-23289ff8ce31";

  // This function calls each query you’ve implemented and logs the result
  const runAllTests = async () => {
    console.log("=== RUNNING ALL TESTS ===");

    // 1) Get current user.
    const { data: userData,error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.log("Error getting user:",userError);
      return;
    }
    const user = userData?.user;
    if (!user) {
      console.log("No user found. Please log in before testing.");
      return;
    }
    console.log("Logged-in user:",user.id);

    // ============ PROFILE QUERIES ============

    // (A) Get profile data
    console.log("--- Testing getProfileData ---");
    const profile = await getProfileData(supabase, user, TEST_PROFILE_ID);
    console.log("Profile data:", profile);

    // (B) Get profiles the user is following
    console.log("--- Testing getFollowing ---");
    const followingList = await getFollowing(supabase, user);
    console.log("Following list:", followingList);

    // (C) Get posts for some profile ID
    console.log("--- Testing getProfilePosts ---");
    const profilePosts = await getProfilePosts(supabase, user, TEST_PROFILE_ID, 0);
    console.log("Profile posts (first 25):", profilePosts);

    // (D) Toggle following
    console.log("--- Testing toggleFollowing ---");
    await toggleFollowing(supabase, user, TEST_PROFILE_ID);
    console.log("Toggled following on profile", TEST_PROFILE_ID);
    // If run again, it will just flip back to the previous state.

    // ============ POST QUERIES ============

    // (E) Get one post
    console.log("--- Testing getPost ---");
    const singlePost = await getPost(supabase, user, TEST_POST_ID);
    console.log("Single post:", singlePost);

    // (F) Get feed
    console.log("--- Testing getFeed ---");
    const feed = await getFeed(supabase, user, 0);
    console.log("Feed (first 25):", feed);

    // (G) Get following feed
    console.log("--- Testing getFollowingFeed ---");
    const followingFeed = await getFollowingFeed(supabase, user, 0);
    console.log("Following feed (first 25):", followingFeed);

    // (H) Get liked post feed
    console.log("--- Testing getLikesFeed ---");
    const likesFeed = await getLikesFeed(supabase, user, 0);
    console.log("Likes feed (first 25):", likesFeed);

    // (I) Toggle like on a post
    console.log("--- Testing toggleLike ---");
    await toggleLike(supabase, user, TEST_POST_ID);
    console.log("Toggled like on post", TEST_POST_ID);

    console.log("=== ALL TESTS COMPLETE ===");
  };

  // Trigger the test code once the page loads.
  useEffect(() => {
    runAllTests();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <h1 className="text-xl font-bold">Oriole App Testing Page</h1>
      <p>Open the browser console to see test results.</p>
    </div>
  );
}
