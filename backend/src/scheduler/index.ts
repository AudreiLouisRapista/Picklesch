import { runDueFormations, toPublicSession } from '../modules/sessions/service';
import { emitCourtAssignments } from '../realtime';

export function startFormationScheduler(intervalMs = 60_000): NodeJS.Timeout {
  const timer = setInterval(() => {
    void runDueFormations()
      .then(async (sessions) => {
        for (const session of sessions) {
          emitCourtAssignments(String(session._id), {
            type: 'court:assigned',
            session: await toPublicSession(session),
          });
        }
      })
      .catch((error) => console.error('Formation scheduler failed:', error));
  }, intervalMs);

  timer.unref();
  return timer;
}
