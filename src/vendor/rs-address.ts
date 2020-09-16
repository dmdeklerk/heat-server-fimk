/*
    NXT address class, extended version (with error guessing).

    Version: 1.0, license: Public Domain, coder: NxtChg (admin@nxtchg.com).
*/
// import { } from 'lodash';

const codeword = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const syndrome = [0, 0, 0, 0, 0];
const gexp = [
  1,
  2,
  4,
  8,
  16,
  5,
  10,
  20,
  13,
  26,
  17,
  7,
  14,
  28,
  29,
  31,
  27,
  19,
  3,
  6,
  12,
  24,
  21,
  15,
  30,
  25,
  23,
  11,
  22,
  9,
  18,
  1,
];
const glog = [
  0,
  0,
  1,
  18,
  2,
  5,
  19,
  11,
  3,
  29,
  6,
  27,
  20,
  8,
  12,
  23,
  4,
  10,
  30,
  17,
  7,
  22,
  28,
  26,
  21,
  25,
  9,
  16,
  13,
  14,
  24,
  15,
];
const cwmap = [3, 2, 1, 0, 7, 6, 5, 4, 13, 14, 15, 16, 12, 8, 9, 10, 11];
const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export class RsAddress {
  private guess = [];
  constructor(private prefix: string) {}

  ginv(a) {
    return gexp[31 - glog[a]];
  }

  gmult(a, b) {
    if (a == 0 || b == 0) return 0;
    let idx = (glog[a] + glog[b]) % 31;
    return gexp[idx];
  }

  calc_discrepancy(lambda, r) {
    let discr = 0;
    for (let i = 0; i < r; i++) {
      discr ^= this.gmult(lambda[i], syndrome[r - i]);
    }
    return discr;
  }

  find_errors(lambda) {
    let errloc = [];
    for (let i = 1; i <= 31; i++) {
      let sum = 0;
      for (let j = 0; j < 5; j++) {
        sum ^= this.gmult(gexp[(j * i) % 31], lambda[j]);
      }
      if (sum == 0) {
        let pos = 31 - i;
        if (pos > 12 && pos < 27) return [];

        errloc[errloc.length] = pos;
      }
    }
    return errloc;
  }

  guess_errors() {
    let el = 0,
      b = [0, 0, 0, 0, 0],
      t = [];
    let deg_lambda = 0,
      lambda = [1, 0, 0, 0, 0]; // error+erasure locator poly
    // Berlekamp-Massey algorithm to determine error+erasure locator polynomial
    for (let r = 0; r < 4; r++) {
      let discr = this.calc_discrepancy(lambda, r + 1); // Compute discrepancy at the r-th step in poly-form
      if (discr != 0) {
        deg_lambda = 0;
        for (let i = 0; i < 5; i++) {
          t[i] = lambda[i] ^ this.gmult(discr, b[i]);
          if (t[i]) deg_lambda = i;
        }
        if (2 * el <= r) {
          el = r + 1 - el;
          for (let i = 0; i < 5; i++) {
            b[i] = this.gmult(lambda[i], this.ginv(discr));
          }
        }
        lambda = t.slice(); // copy
      }
      b.unshift(0); // shift => mul by x
    }

    // Find roots of the locator polynomial.
    let errloc = this.find_errors(lambda);
    let errors = errloc.length;

    if (errors < 1 || errors > 2) return false;
    if (deg_lambda != errors) return false; // deg(lambda) unequal to number of roots => uncorrectable error

    // Compute err+eras evaluator poly omega(x) = s(x)*lambda(x) (modulo x**(4)). Also find deg(omega).

    let omega = [0, 0, 0, 0, 0];
    for (let i = 0; i < 4; i++) {
      let t = 0;
      for (let j = 0; j < i; j++) {
        t ^= this.gmult(syndrome[i + 1 - j], lambda[j]);
      }
      omega[i] = t;
    }

    // Compute error values in poly-form.

    for (let r = 0; r < errors; r++) {
      let t = 0;
      let pos = errloc[r];
      let root = 31 - pos;

      for (
        let i = 0;
        i < 4;
        i++ // evaluate Omega at alpha^(-i)
      ) {
        t ^= this.gmult(omega[i], gexp[(root * i) % 31]);
      }

      if (t) {
        // evaluate Lambda' (derivative) at alpha^(-i); all odd powers disappear
        let denom =
          this.gmult(lambda[1], 1) ^
          this.gmult(lambda[3], gexp[(root * 2) % 31]);
        if (denom == 0) return false;
        if (pos > 12) pos -= 14;
        codeword[pos] ^= this.gmult(t, this.ginv(denom));
      }
    }

    return true;
  }

  encode() {
    let p = [0, 0, 0, 0];
    for (let i = 12; i >= 0; i--) {
      let fb = codeword[i] ^ p[3];
      p[3] = p[2] ^ this.gmult(30, fb);
      p[2] = p[1] ^ this.gmult(6, fb);
      p[1] = p[0] ^ this.gmult(9, fb);
      p[0] = this.gmult(17, fb);
    }

    codeword[13] = p[0];
    codeword[14] = p[1];
    codeword[15] = p[2];
    codeword[16] = p[3];
  }

  reset() {
    for (let i = 0; i < 17; i++) {
      codeword[i] = 1;
    }
  }

  set_codeword(cw, len?, skip?) {
    if (typeof len === 'undefined') len = 17;
    if (typeof skip === 'undefined') skip = -1;

    for (let i = 0, j = 0; i < len; i++) {
      if (i != skip) codeword[cwmap[j++]] = cw[i];
    }
  }

  add_guess() {
    let s = this.toString(),
      len = this.guess.length;

    if (len > 2) return;

    for (let i = 0; i < len; i++) {
      if (this.guess[i] == s) return;
    }

    this.guess[len] = s;
  }

  ok() {
    let sum = 0,
      t;
    for (let i = 1; i < 5; i++) {
      for (let j = 0, t = 0; j < 31; j++) {
        if (j > 12 && j < 27) continue;
        let pos = j;
        if (j > 26) pos -= 14;
        t ^= this.gmult(codeword[pos], gexp[(i * j) % 31]);
      }

      sum |= t;
      syndrome[i] = t;
    }

    return sum == 0;
  }

  from_acc(acc) {
    let inp = [],
      out = [],
      pos = 0,
      len = acc.length;

    if (len == 20 && acc.charAt(0) != '1') return false;
    for (let i = 0; i < len; i++) {
      inp[i] = acc.charCodeAt(i) - '0'.charCodeAt(0);
    }
    do // base 10 to base 32 conversion
    {
      var divide = 0,
        newlen = 0;
      for (let i = 0; i < len; i++) {
        divide = divide * 10 + inp[i];

        if (divide >= 32) {
          inp[newlen++] = divide >> 5;
          divide &= 31;
        } else if (newlen > 0) {
          inp[newlen++] = 0;
        }
      }

      len = newlen;
      out[pos++] = divide;
    } while (newlen);

    for (
      let i = 0;
      i < 13;
      i++ // copy to codeword in reverse, pad with 0's
    ) {
      codeword[i] = --pos >= 0 ? out[i] : 0;
    }

    this.encode();

    return true;
  }

  toString() {
    let out = this.prefix + '-';

    for (let i = 0; i < 17; i++) {
      out += alphabet[codeword[cwmap[i]]];

      if ((i & 3) == 3 && i < 13) out += '-';
    }

    return out;
  }

  account_id() {
    let out = '',
      inp = [],
      len = 13;

    for (let i = 0; i < 13; i++) {
      inp[i] = codeword[12 - i];
    }

    do // base 32 to base 10 conversion
    {
      var divide = 0,
        newlen = 0;

      for (let i = 0; i < len; i++) {
        divide = divide * 32 + inp[i];

        if (divide >= 10) {
          inp[newlen++] = Math.floor(divide / 10);
          divide %= 10;
        } else if (newlen > 0) {
          inp[newlen++] = 0;
        }
      }

      len = newlen;
      out += String.fromCharCode(divide + '0'.charCodeAt(0));
    } while (newlen);

    return out
      .split('')
      .reverse()
      .join('');
  }

  set(adr, allow_accounts?) {
    if (typeof allow_accounts === 'undefined') allow_accounts = true;

    let len = 0;
    this.guess = [];
    this.reset();

    adr = String(adr);

    adr = adr.replace(/(^\s+)|(\s+$)/g, '').toUpperCase();

    if (adr.indexOf(this.prefix + '-') == 0) adr = adr.substr(4);

    if (adr.match(/^\d{1,20}$/g)) {
      // account id
      if (allow_accounts) return this.from_acc(adr);
    } // address
    else {
      var clean = [];

      for (let i = 0; i < adr.length; i++) {
        let pos = alphabet.indexOf(adr[i]);

        if (pos >= 0) {
          clean[len++] = pos;
          if (len > 18) return false;
        }
      }
    }

    if (len == 16) {
      // guess deletion
      for (let i = 16; i >= 0; i--) {
        for (let j = 0; j < 32; j++) {
          clean[i] = j;

          this.set_codeword(clean);

          if (this.ok()) this.add_guess();
        }

        if (i > 0) {
          let t = clean[i - 1];
          clean[i - 1] = clean[i];
          clean[i] = t;
        }
      }
    }

    if (len == 18) {
      // guess insertion
      for (let i = 0; i < 18; i++) {
        this.set_codeword(clean, 18, i);

        if (this.ok()) this.add_guess();
      }
    }

    if (len == 17) {
      this.set_codeword(clean);

      if (this.ok()) return true;

      if (this.guess_errors() && this.ok()) this.add_guess();
    }

    this.reset();

    return false;
  }

  format_guess(s, org) {
    let d = '',
      list = [];

    s = s.toUpperCase();
    org = org.toUpperCase();

    for (let i = 0; i < s.length; ) {
      let m = 0;

      for (let j = 1; j < s.length; j++) {
        let pos = org.indexOf(s.substr(i, j));

        if (pos != -1) {
          if (Math.abs(pos - i) < 3) m = j;
        } else break;
      }

      if (m) {
        list[list.length] = {
          s: i,
          e: i + m,
        };
        i += m;
      } else i++;
    }

    if (list.length == 0) return s;

    for (let i = 0, j = 0; i < s.length; i++) {
      if (i >= list[j].e) {
        let start;

        while (j < list.length - 1) {
          start = list[j++].s;

          if (i < list[j].e || list[j].s >= start) break;
        }
      }

      if (i >= list[j].s && i < list[j].e) {
        d += s.charAt(i);
      } else {
        d += '<b style="color:red">' + s.charAt(i) + '</b>';
      }
    }

    return d;
  }
}
