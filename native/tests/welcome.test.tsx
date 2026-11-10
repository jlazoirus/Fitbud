import { render, screen } from '@testing-library/react-native';
import WelcomeScreen from '../app/index';

describe('Arranque de Evolv', () => {
  it('muestra el estado inicial accesible antes de conectar las cuentas', async () => {
    await render(<WelcomeScreen />);
    expect(screen.getByRole('header')).toHaveTextContent(/Tu mejor versión,/);
    expect(screen.getByText('Estamos preparando tu experiencia en el teléfono.')).toBeOnTheScreen();
  });
});
