-- Migration: 20260810000000_notifications_triggers.sql
-- Add PostgreSQL database triggers to automatically generate notifications
-- for chat messages, interview invitations, status updates, and feedback.

-- 1. EXTEND NOTIFICATION_TYPE ENUM
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'invitation_declined';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'invitation_countered';

-- 2. CHAT MESSAGE NOTIFICATION TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_new_message_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_sender_name text;
BEGIN
  -- Get sender's name from profiles
  SELECT name INTO v_sender_name FROM public.profiles WHERE id = NEW.sender_id;
  IF v_sender_name IS NULL OR v_sender_name = '' THEN
    v_sender_name := 'A peer';
  END IF;

  INSERT INTO public.notifications (
    user_id,
    actor_id,
    type,
    reference_id,
    message
  ) VALUES (
    NEW.receiver_id,
    NEW.sender_id,
    'message_received',
    NEW.id,
    v_sender_name || ': ' || substring(NEW.content from 1 for 60)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on messages
DROP TRIGGER IF EXISTS tr_new_message_notification ON public.messages;
CREATE TRIGGER tr_new_message_notification
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_message_notification();


-- 3. INVITATION NOTIFICATION TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_invitation_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_actor_name text;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    -- New invitation created -> Notify receiver
    SELECT name INTO v_actor_name FROM public.profiles WHERE id = NEW.sender_id;
    IF v_actor_name IS NULL OR v_actor_name = '' THEN v_actor_name := 'A peer'; END IF;

    INSERT INTO public.notifications (
      user_id,
      actor_id,
      type,
      reference_id,
      message
    ) VALUES (
      NEW.receiver_id,
      NEW.sender_id,
      'invitation_received',
      NEW.id,
      v_actor_name || ' sent you an interview request (' || NEW.format || ').'
    );

  ELSIF (TG_OP = 'UPDATE') THEN
    -- Status changed
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
      IF NEW.status = 'accepted' THEN
        -- Receiver accepted -> Notify sender
        SELECT name INTO v_actor_name FROM public.profiles WHERE id = NEW.receiver_id;
        IF v_actor_name IS NULL OR v_actor_name = '' THEN v_actor_name := 'Your peer'; END IF;

        INSERT INTO public.notifications (
          user_id,
          actor_id,
          type,
          reference_id,
          message
        ) VALUES (
          NEW.sender_id,
          NEW.receiver_id,
          'invitation_accepted',
          NEW.id,
          v_actor_name || ' accepted your interview request!'
        );

      ELSIF NEW.status = 'countered' THEN
        -- Countered -> notify sender
        SELECT name INTO v_actor_name FROM public.profiles WHERE id = NEW.receiver_id;
        IF v_actor_name IS NULL OR v_actor_name = '' THEN v_actor_name := 'Your peer'; END IF;

        INSERT INTO public.notifications (
          user_id,
          actor_id,
          type,
          reference_id,
          message
        ) VALUES (
          NEW.sender_id,
          NEW.receiver_id,
          'invitation_countered',
          NEW.id,
          v_actor_name || ' proposed new time slots for the interview.'
        );

      ELSIF NEW.status = 'declined' THEN
        -- Declined -> notify sender
        SELECT name INTO v_actor_name FROM public.profiles WHERE id = NEW.receiver_id;
        IF v_actor_name IS NULL OR v_actor_name = '' THEN v_actor_name := 'Your peer'; END IF;

        INSERT INTO public.notifications (
          user_id,
          actor_id,
          type,
          reference_id,
          message
        ) VALUES (
          NEW.sender_id,
          NEW.receiver_id,
          'invitation_declined',
          NEW.id,
          v_actor_name || ' declined the interview request.'
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on invitations
DROP TRIGGER IF EXISTS tr_invitation_notification ON public.invitations;
CREATE TRIGGER tr_invitation_notification
  AFTER INSERT OR UPDATE ON public.invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_invitation_notification();


-- 4. FEEDBACK NOTIFICATION TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_feedback_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_reviewer_name text;
BEGIN
  SELECT name INTO v_reviewer_name FROM public.profiles WHERE id = NEW.reviewer_id;
  IF v_reviewer_name IS NULL OR v_reviewer_name = '' THEN v_reviewer_name := 'Your peer'; END IF;

  INSERT INTO public.notifications (
    user_id,
    actor_id,
    type,
    reference_id,
    message
  ) VALUES (
    NEW.recipient_id,
    NEW.reviewer_id,
    'feedback_received',
    NEW.session_id,
    v_reviewer_name || ' submitted feedback for your interview session.'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on feedback
DROP TRIGGER IF EXISTS tr_feedback_notification ON public.feedback;
CREATE TRIGGER tr_feedback_notification
  AFTER INSERT ON public.feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_feedback_notification();
