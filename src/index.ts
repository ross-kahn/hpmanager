/**
 * Sets up environment constants and spins up the app
 */
import app from "./config/app";

const PORT = 3000;

app.listen(PORT, () =>
{
   console.log('Express server listening on port ' + PORT);
})