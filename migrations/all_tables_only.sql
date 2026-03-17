-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.daily_vibe_status (
                                          profile_id uuid NOT NULL,
                                          vibe_date date NOT NULL DEFAULT ((now() AT TIME ZONE 'utc'::text))::date,
                                          vibe text NOT NULL CHECK (vibe = ANY (ARRAY['aura_up'::text, 'real'::text, 'mood'::text, 'chaotic'::text])),
                                          note text CHECK (char_length(note) <= 280),
                                          created_at timestamp with time zone NOT NULL DEFAULT now(),
                                          updated_at timestamp with time zone NOT NULL DEFAULT now(),
                                          CONSTRAINT daily_vibe_status_pkey PRIMARY KEY (profile_id, vibe_date),
                                          CONSTRAINT daily_vibe_status_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profile(id)
);
CREATE TABLE public.follow (
                               follower_id uuid NOT NULL DEFAULT gen_random_uuid(),
                               following_id uuid NOT NULL DEFAULT gen_random_uuid(),
                               CONSTRAINT follow_pkey PRIMARY KEY (follower_id, following_id),
                               CONSTRAINT follow_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES public.profile(id),
                               CONSTRAINT follow_following_id_fkey FOREIGN KEY (following_id) REFERENCES public.profile(id)
);
CREATE TABLE public.like (
                             post_id uuid NOT NULL DEFAULT gen_random_uuid(),
                             profile_id uuid NOT NULL DEFAULT gen_random_uuid(),
                             CONSTRAINT like_pkey PRIMARY KEY (post_id, profile_id),
                             CONSTRAINT like_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.post(id),
                             CONSTRAINT like_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profile(id)
);
CREATE TABLE public.notification (
                                     id uuid NOT NULL DEFAULT gen_random_uuid(),
                                     recipient_id uuid NOT NULL,
                                     actor_id uuid,
                                     type text NOT NULL CHECK (type = ANY (ARRAY['post_comment'::text, 'comment_reply'::text, 'comment_mention'::text, 'comment_vibe'::text])),
                                     post_id uuid,
                                     comment_id uuid,
                                     payload jsonb NOT NULL DEFAULT '{}'::jsonb,
                                     is_read boolean NOT NULL DEFAULT false,
                                     created_at timestamp with time zone NOT NULL DEFAULT now(),
                                     CONSTRAINT notification_pkey PRIMARY KEY (id),
                                     CONSTRAINT notification_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.profile(id),
                                     CONSTRAINT notification_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.profile(id),
                                     CONSTRAINT notification_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.post(id),
                                     CONSTRAINT notification_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.post_comment(id)
);
CREATE TABLE public.post (
                             id uuid NOT NULL DEFAULT gen_random_uuid(),
                             content text NOT NULL,
                             posted_at timestamp with time zone,
                             author_id uuid DEFAULT gen_random_uuid(),
                             attachment_url text,
                             comment_count integer NOT NULL DEFAULT 0 CHECK (comment_count >= 0),
                             CONSTRAINT post_pkey PRIMARY KEY (id),
                             CONSTRAINT post_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profile(id)
);
CREATE TABLE public.post_attachment (
                                        id uuid NOT NULL DEFAULT gen_random_uuid(),
                                        post_id uuid NOT NULL,
                                        path text NOT NULL,
                                        position smallint NOT NULL CHECK ("position" >= 1 AND "position" <= 8),
                                        created_at timestamp with time zone NOT NULL DEFAULT now(),
                                        CONSTRAINT post_attachment_pkey PRIMARY KEY (id),
                                        CONSTRAINT post_attachment_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.post(id)
);
CREATE TABLE public.post_comment (
                                     id uuid NOT NULL DEFAULT gen_random_uuid(),
                                     post_id uuid NOT NULL,
                                     author_id uuid NOT NULL,
                                     parent_comment_id uuid,
                                     content text CHECK (char_length(content) <= 500),
                                     image_url text,
                                     created_at timestamp with time zone NOT NULL DEFAULT now(),
                                     updated_at timestamp with time zone NOT NULL DEFAULT now(),
                                     reply_count integer NOT NULL DEFAULT 0 CHECK (reply_count >= 0),
                                     vibe_count integer NOT NULL DEFAULT 0 CHECK (vibe_count >= 0),
                                     engagement_score integer DEFAULT (vibe_count + (reply_count * 2)),
                                     CONSTRAINT post_comment_pkey PRIMARY KEY (id),
                                     CONSTRAINT post_comment_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.post(id),
                                     CONSTRAINT post_comment_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profile(id),
                                     CONSTRAINT post_comment_parent_comment_id_fkey FOREIGN KEY (parent_comment_id) REFERENCES public.post_comment(id)
);
CREATE TABLE public.post_comment_mention (
                                             comment_id uuid NOT NULL,
                                             mentioned_profile_id uuid NOT NULL,
                                             created_at timestamp with time zone NOT NULL DEFAULT now(),
                                             CONSTRAINT post_comment_mention_pkey PRIMARY KEY (comment_id, mentioned_profile_id),
                                             CONSTRAINT post_comment_mention_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.post_comment(id),
                                             CONSTRAINT post_comment_mention_mentioned_profile_id_fkey FOREIGN KEY (mentioned_profile_id) REFERENCES public.profile(id)
);
CREATE TABLE public.post_comment_report (
                                            id uuid NOT NULL DEFAULT gen_random_uuid(),
                                            comment_id uuid NOT NULL,
                                            reporter_id uuid NOT NULL,
                                            reason text NOT NULL CHECK (char_length(reason) >= 2 AND char_length(reason) <= 80),
                                            details text CHECK (char_length(details) <= 500),
                                            created_at timestamp with time zone NOT NULL DEFAULT now(),
                                            CONSTRAINT post_comment_report_pkey PRIMARY KEY (id),
                                            CONSTRAINT post_comment_report_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.post_comment(id),
                                            CONSTRAINT post_comment_report_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.profile(id)
);
CREATE TABLE public.post_comment_vibe_reaction (
                                                   comment_id uuid NOT NULL,
                                                   profile_id uuid NOT NULL,
                                                   vibe text NOT NULL CHECK (vibe = ANY (ARRAY['aura_up'::text, 'real'::text, 'mood'::text, 'chaotic'::text])),
                                                   reacted_at timestamp with time zone NOT NULL DEFAULT now(),
                                                   CONSTRAINT post_comment_vibe_reaction_pkey PRIMARY KEY (comment_id, profile_id),
                                                   CONSTRAINT post_comment_vibe_reaction_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.post_comment(id),
                                                   CONSTRAINT post_comment_vibe_reaction_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profile(id)
);
CREATE TABLE public.post_poll (
                                  post_id uuid NOT NULL,
                                  question text,
                                  created_at timestamp with time zone NOT NULL DEFAULT now(),
                                  CONSTRAINT post_poll_pkey PRIMARY KEY (post_id),
                                  CONSTRAINT post_poll_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.post(id)
);
CREATE TABLE public.post_poll_option (
                                         id uuid NOT NULL DEFAULT gen_random_uuid(),
                                         post_id uuid NOT NULL,
                                         label text NOT NULL,
                                         position smallint NOT NULL CHECK ("position" >= 1 AND "position" <= 4),
                                         CONSTRAINT post_poll_option_pkey PRIMARY KEY (id),
                                         CONSTRAINT post_poll_option_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.post_poll(post_id)
);
CREATE TABLE public.post_poll_vote (
                                       post_id uuid NOT NULL,
                                       option_id uuid NOT NULL,
                                       profile_id uuid NOT NULL,
                                       voted_at timestamp with time zone NOT NULL DEFAULT now(),
                                       CONSTRAINT post_poll_vote_pkey PRIMARY KEY (post_id, profile_id),
                                       CONSTRAINT post_poll_vote_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.post_poll(post_id),
                                       CONSTRAINT post_poll_vote_option_id_fkey FOREIGN KEY (option_id) REFERENCES public.post_poll_option(id),
                                       CONSTRAINT post_poll_vote_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profile(id)
);
CREATE TABLE public.profile (
                                id uuid NOT NULL,
                                name text,
                                handle text,
                                avatar_url text,
                                CONSTRAINT profile_pkey PRIMARY KEY (id),
                                CONSTRAINT profile_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.vibe_reaction (
                                      post_id uuid NOT NULL,
                                      profile_id uuid NOT NULL,
                                      vibe text NOT NULL CHECK (vibe = ANY (ARRAY['aura_up'::text, 'real'::text, 'mood'::text, 'chaotic'::text])),
                                      reacted_at timestamp with time zone NOT NULL DEFAULT now(),
                                      CONSTRAINT vibe_reaction_pkey PRIMARY KEY (post_id, profile_id),
                                      CONSTRAINT vibe_reaction_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.post(id),
                                      CONSTRAINT vibe_reaction_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profile(id)
);
